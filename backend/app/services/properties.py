import uuid
from decimal import Decimal

from fastapi import status
from sqlalchemy import func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.property import Property, PropertyCategory, PropertyStatus
from app.models.user import User
from app.rbac.permissions import Role
from app.schemas.property import CreatePropertyRequest, UpdatePropertyRequest


async def create(session: AsyncSession, actor: User, data: CreatePropertyRequest) -> Property:
    listing = Property(
        title=data.title,
        address=data.address,
        category=data.category,
        description=data.description,
        image_url=data.image_url,
        reserve_price=data.reserve_price,
        # A seller listing their own asset owns it; staff list on behalf of nobody in particular.
        seller_id=actor.id if Role.SELLER in actor.roles else None,
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
    category: PropertyCategory | None,
    property_status: PropertyStatus | None,
    min_price: Decimal | None = None,
    max_price: Decimal | None = None,
) -> tuple[list[Property], int]:
    query = select(Property)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            or_(
                func.lower(Property.title).like(pattern), func.lower(Property.address).like(pattern)
            )
        )
    if category:
        query = query.where(Property.category == category)
    if property_status:
        query = query.where(Property.status == property_status)
    if min_price is not None:
        query = query.where(Property.reserve_price >= min_price)
    if max_price is not None:
        query = query.where(Property.reserve_price <= max_price)

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(Property.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


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
