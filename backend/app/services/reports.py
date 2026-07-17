from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auction import Auction
from app.models.property import Property, PropertyCategory, PropertyStatus
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.schemas.report import CategoryCount, DashboardOut, WeeklyCount

WEEKS = 8


async def _count(session: AsyncSession, *where) -> int:
    return await session.scalar(select(func.count()).select_from(Property).where(*where)) or 0


async def dashboard(session: AsyncSession) -> DashboardOut:
    """Every headline number on the super admin dashboard, in one round of queries."""
    since = datetime.now(UTC) - timedelta(weeks=WEEKS)

    live = await session.scalar(
        select(func.count())
        .select_from(Auction)
        .where(
            Auction.ended_at.is_(None),
            Auction.ends_at > func.now(),
            Auction.starts_at <= func.now(),
        )
    )
    # Revenue is money actually taken: auction awards plus direct Buy Now payments.
    awarded = await session.scalar(
        select(func.coalesce(func.sum(Property.reserve_price), 0))
        .select_from(Auction)
        .join(Property, Property.id == Auction.property_id)
        .where(Auction.winner_id.is_not(None))
    )
    bought = await session.scalar(
        select(func.coalesce(func.sum(Property.paid_amount), 0)).where(
            Property.buyer_id.is_not(None)
        )
    )

    categories = await session.execute(
        select(Property.category, func.count()).group_by(Property.category)
    )
    mix = {row[0]: row[1] for row in categories.all()}

    signups = await session.execute(
        select(func.date_trunc("week", User.created_at).label("week"), func.count())
        .where(User.created_at >= since, User.status != UserStatus.DELETED)
        .group_by("week")
        .order_by("week")
    )

    return DashboardOut(
        total_buyers=await _role_count(session, Role.BUYER),
        total_sellers=await _role_count(session, Role.SELLER),
        active_auctions=live or 0,
        total_listings=await _count(session),
        published_listings=await _count(session, Property.status == PropertyStatus.PUBLISHED),
        sold_listings=await _count(session, Property.status == PropertyStatus.SOLD),
        pending_approvals=await _count(session, Property.status == PropertyStatus.DRAFT),
        total_revenue=Decimal(awarded or 0) + Decimal(bought or 0),
        category_mix=[
            CategoryCount(category=category, count=mix.get(category, 0))
            for category in PropertyCategory
        ],
        weekly_signups=[WeeklyCount(week=row[0], count=row[1]) for row in signups.all()],
    )


async def _role_count(session: AsyncSession, role: Role) -> int:
    return (
        await session.scalar(
            select(func.count())
            .select_from(User)
            .where(User.status != UserStatus.DELETED, User.role_rows.any(UserRole.role == role))
        )
        or 0
    )
