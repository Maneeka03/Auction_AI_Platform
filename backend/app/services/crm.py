from decimal import Decimal

from sqlalchemy import Row, func, or_, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auction import Auction, Bid
from app.models.escrow import Escrow, EscrowState
from app.models.property import Property, PropertyStatus
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role


def _members(role: Role, search: str | None):
    query = select(User).where(
        User.status != UserStatus.DELETED, User.role_rows.any(UserRole.role == role)
    )
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            or_(User.email.ilike(pattern), func.lower(User.full_name).like(pattern))
        )
    return query


async def buyers(
    session: AsyncSession, page: int, size: int, search: str | None
) -> tuple[list[Row], int]:
    bids = _tally(Bid.bidder_id)
    won = _tally(Auction.winner_id, Auction.winner_id.is_not(None))
    bought = _tally(Property.buyer_id, Property.buyer_id.is_not(None))

    base = _members(Role.BUYER, search)
    total = await session.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = await session.execute(
        base.add_columns(
            func.coalesce(bids.c.n, 0), func.coalesce(won.c.n, 0), func.coalesce(bought.c.n, 0)
        )
        .outerjoin(bids, bids.c.uid == User.id)
        .outerjoin(won, won.c.uid == User.id)
        .outerjoin(bought, bought.c.uid == User.id)
        .order_by(User.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return [(r[0], r[1], r[2], r[3]) for r in rows.all()], total


async def sellers(
    session: AsyncSession, page: int, size: int, search: str | None
) -> tuple[list[Row], int]:
    listings = (
        select(
            Property.seller_id.label("uid"),
            func.count().label("listings"),
            func.count().filter(Property.status == PropertyStatus.SOLD).label("sold"),
        )
        .where(Property.seller_id.is_not(None))
        .group_by(Property.seller_id)
        .subquery()
    )
    payouts = (
        select(
            Escrow.seller_id.label("uid"), func.coalesce(func.sum(Escrow.amount), 0).label("paid")
        )
        .where(Escrow.state == EscrowState.RELEASED, Escrow.seller_id.is_not(None))
        .group_by(Escrow.seller_id)
        .subquery()
    )

    base = _members(Role.SELLER, search)
    total = await session.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = await session.execute(
        base.add_columns(
            func.coalesce(listings.c.listings, 0),
            func.coalesce(listings.c.sold, 0),
            func.coalesce(payouts.c.paid, 0),
        )
        .outerjoin(listings, listings.c.uid == User.id)
        .outerjoin(payouts, payouts.c.uid == User.id)
        .order_by(User.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return [(r[0], r[1], r[2], Decimal(r[3])) for r in rows.all()], total


def _tally(column, *where):
    """A per-user count subquery: how many rows each user owns through `column`."""
    query = select(column.label("uid"), func.count().label("n"))
    if where:
        query = query.where(*where)
    return query.group_by(column).subquery()
