import uuid
from datetime import UTC, datetime
from decimal import ROUND_HALF_UP, Decimal

from fastapi import status
from sqlalchemy import ColumnElement, and_, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.errors import AppError
from app.models.auction import Auction
from app.models.category import Category
from app.models.property import PaymentMethod, Property, PropertyStatus
from app.models.user import User
from app.models.wallet import WalletEntryKind
from app.rbac.permissions import Role
from app.schemas.property import CreatePropertyRequest, UpdatePropertyRequest
from app.services import categories, escrow, kyc, wallets

EARTH_KM = 6371


def _within(lat: Decimal, lng: Decimal, radius_km: float) -> ColumnElement[bool]:
    """Haversine filter: listings that have coordinates and sit within radius_km of (lat, lng)."""
    distance = EARTH_KM * func.acos(
        func.cos(func.radians(lat))
        * func.cos(func.radians(Property.latitude))
        * func.cos(func.radians(Property.longitude) - func.radians(lng))
        + func.sin(func.radians(lat)) * func.sin(func.radians(Property.latitude))
    )
    return and_(
        Property.latitude.is_not(None), Property.longitude.is_not(None), distance <= radius_km
    )


async def create(session: AsyncSession, actor: User, data: CreatePropertyRequest) -> Property:
    # Assigned by object so the category is loaded for serialising, as with the seller below.
    category = await categories.get(session, data.category_id)
    listing = Property(
        title=data.title,
        address=data.address,
        category=category,
        description=data.description,
        image_url=data.image_url,
        reserve_price=data.reserve_price,
        bedrooms=data.bedrooms,
        bathrooms=data.bathrooms,
        area_sqft=data.area_sqft,
        latitude=data.latitude,
        longitude=data.longitude,
        # A seller listing their own asset owns it; staff list on behalf of nobody in particular.
        # Assigned by object, not id: that leaves both relationships loaded, so serialising the
        # result cannot trigger a lazy load on a greenlet-less async path.
        seller=actor if Role.SELLER in actor.roles else None,
        votes=[],
    )
    session.add(listing)
    await session.commit()
    return listing


async def get(session: AsyncSession, property_id: uuid.UUID) -> Property:
    listing = await session.get(Property, property_id)
    if listing is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "property_not_found", "Property not found.")
    return listing


async def paginate(
    session: AsyncSession,
    page: int,
    size: int,
    search: str | None,
    category_id: uuid.UUID | None,
    property_status: PropertyStatus | None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
    near: tuple[Decimal, Decimal, float] | None = None,
) -> tuple[list[Property], int]:
    query = select(Property)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Property.title).like(pattern), func.lower(Property.address).like(pattern)
            )
        )
    if category_id:
        # Filtering on a main category also returns everything in its subcategories.
        query = query.where(
            or_(
                Property.category_id == category_id,
                Property.category_id.in_(
                    select(Category.id).where(Category.parent_id == category_id)
                ),
            )
        )
    if property_status:
        query = query.where(Property.status == property_status)
    if min_price is not None:
        query = query.where(Property.reserve_price >= min_price)
    if max_price is not None:
        query = query.where(Property.reserve_price <= max_price)
    if near is not None:
        query = query.where(_within(*near))

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(Property.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


async def purchase(
    session: AsyncSession, buyer: User, property_id: uuid.UUID, method: PaymentMethod
) -> Property:
    """Buy a published listing outright, paying in full or reserving it with a token deposit."""
    if Role.BUYER not in buyer.roles:
        raise AppError(status.HTTP_403_FORBIDDEN, "forbidden", "Only buyers can purchase.")
    await kyc.require_verified(session, buyer.id)

    listing = await locked(session, property_id)
    if listing.status is not PropertyStatus.PUBLISHED:
        raise AppError(
            status.HTTP_409_CONFLICT, "not_for_sale", "This property is not available to buy."
        )

    running = await session.scalar(
        select(func.count())
        .select_from(Auction)
        .where(Auction.property_id == property_id, Auction.ended_at.is_(None))
    )
    if running:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "auction_running",
            "This property is being auctioned and cannot be bought directly.",
        )

    price = listing.reserve_price
    if method is PaymentMethod.TOKEN:
        price = (price * settings.purchase_token_percent / 100).quantize(
            wallets.CENTS, rounding=ROUND_HALF_UP
        )

    wallet = await wallets.locked(session, buyer.id)
    if price > await wallets.spendable(session, wallet):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "insufficient_funds",
            "Your wallet does not cover this purchase. Add funds and try again.",
        )

    wallet.balance -= price
    listing.status = PropertyStatus.SOLD
    listing.buyer_id = buyer.id
    listing.payment_method = method
    listing.paid_amount = price
    listing.purchased_at = datetime.now(UTC)
    wallets.log(session, buyer.id, WalletEntryKind.PURCHASE, -price)
    # The money is held in escrow until staff release it to the seller (services/escrow). A
    # staff-listed property has no seller, so its funds simply stay with the platform.
    if listing.seller_id is not None:
        escrow.open_for(session, listing, buyer.id, price)
    await session.commit()
    return listing


async def by_seller(session: AsyncSession, seller_id: uuid.UUID) -> list[Property]:
    """A seller's own listings, newest first. Votes ride along, so they see approval progress."""
    rows = await session.scalars(
        select(Property).where(Property.seller_id == seller_id).order_by(Property.created_at.desc())
    )
    return list(rows)


async def locked(session: AsyncSession, property_id: uuid.UUID) -> Property:
    """Fetch a listing FOR UPDATE, so two buyers cannot both win the same Buy Now."""
    result = await session.execute(
        select(Property).where(Property.id == property_id).with_for_update()
    )
    listing = result.scalar_one_or_none()
    if listing is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "property_not_found", "Property not found.")
    return listing


async def update(
    session: AsyncSession, property_id: uuid.UUID, data: UpdatePropertyRequest
) -> Property:
    listing = await get(session, property_id)
    if listing.status is PropertyStatus.SOLD:
        raise AppError(
            status.HTTP_409_CONFLICT, "property_sold", "A sold property can no longer be edited."
        )

    # Null means "leave it alone", never "write NULL" - title, address, category, status and
    # reserve_price are all NOT NULL. Send "" to blank a description or image_url.
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(listing, field, value)

    await session.commit()
    return listing


async def delete(session: AsyncSession, property_id: uuid.UUID) -> None:
    """Remove a listing that never sold and was never auctioned.

    Blocked once sold (a paid transaction must survive) or once any auction
    has ever been created against it (that auction's history must survive) -
    the same principle as auctions refusing to delete once bids exist.
    """
    listing = await get(session, property_id)
    if listing.status is PropertyStatus.SOLD:
        raise AppError(
            status.HTTP_409_CONFLICT, "property_sold", "A sold property cannot be deleted."
        )

    has_auction = await session.scalar(
        select(func.count()).select_from(Auction).where(Auction.property_id == property_id)
    )
    if has_auction:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "property_has_auction",
            "This property has an associated auction and cannot be deleted.",
        )

    await session.delete(listing)
    await session.commit()
