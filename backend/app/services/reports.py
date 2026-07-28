from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auction import Auction, Bid
from app.models.category import Category
from app.models.property import Property, PropertyStatus
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.schemas.report import (
    AuctionActivityOut,
    CategoryCount,
    DashboardOut,
    MonthlyAmount,
    RevenueOut,
    WeeklyCount,
)

WEEKS = 8
MONTHS = 6


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
        select(Category.name, func.count())
        .join(Property, Property.category_id == Category.id)
        .group_by(Category.name)
        .order_by(Category.name)
    )

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
            CategoryCount(category=name, count=count) for name, count in categories.all()
        ],
        weekly_signups=[WeeklyCount(week=row[0], count=row[1]) for row in signups.all()],
    )


async def revenue(session: AsyncSession) -> RevenueOut:
    """Money actually taken, split by source, with a per-month series for the Revenue page.

    Auction sales are valued at the property's reserve price and direct Buy Now sales at what was
    paid - the same definition the dashboard total uses.
    """
    auction_rev = await session.scalar(
        select(func.coalesce(func.sum(Property.reserve_price), 0))
        .select_from(Auction)
        .join(Property, Property.id == Auction.property_id)
        .where(Auction.winner_id.is_not(None))
    )
    direct_rev = await session.scalar(
        select(func.coalesce(func.sum(Property.paid_amount), 0)).where(
            Property.buyer_id.is_not(None)
        )
    )

    since = datetime.now(UTC) - timedelta(days=30 * MONTHS)
    direct_months = await session.execute(
        select(func.date_trunc("month", Property.purchased_at), func.sum(Property.paid_amount))
        .where(Property.purchased_at.is_not(None), Property.purchased_at >= since)
        .group_by(func.date_trunc("month", Property.purchased_at))
    )
    auction_months = await session.execute(
        select(func.date_trunc("month", Auction.ended_at), func.sum(Property.reserve_price))
        .join(Property, Property.id == Auction.property_id)
        .where(Auction.winner_id.is_not(None), Auction.ended_at >= since)
        .group_by(func.date_trunc("month", Auction.ended_at))
    )
    monthly: dict[datetime, Decimal] = {}
    for month, amount in [*direct_months.all(), *auction_months.all()]:
        monthly[month] = monthly.get(month, Decimal(0)) + amount

    return RevenueOut(
        total_revenue=Decimal(auction_rev or 0) + Decimal(direct_rev or 0),
        auction_revenue=Decimal(auction_rev or 0),
        direct_sales_revenue=Decimal(direct_rev or 0),
        sales_count=await _count(session, Property.status == PropertyStatus.SOLD),
        monthly=[MonthlyAmount(month=month, amount=monthly[month]) for month in sorted(monthly)],
    )


async def auction_activity(session: AsyncSession) -> AuctionActivityOut:
    """Auction counts by state plus a weekly created-count series for the Auction Activity page."""
    now = func.now()
    row = (
        await session.execute(
            select(
                func.count().label("total"),
                func.count()
                .filter(Auction.ended_at.is_(None), Auction.ends_at > now, Auction.starts_at > now)
                .label("upcoming"),
                func.count()
                .filter(Auction.ended_at.is_(None), Auction.ends_at > now, Auction.starts_at <= now)
                .label("live"),
                func.count().filter(Auction.winner_id.is_not(None)).label("awarded"),
            )
        )
    ).one()
    total_bids = await session.scalar(select(func.count()).select_from(Bid))

    since = datetime.now(UTC) - timedelta(weeks=WEEKS)
    weekly = await session.execute(
        select(func.date_trunc("week", Auction.created_at).label("week"), func.count())
        .where(Auction.created_at >= since)
        .group_by("week")
        .order_by("week")
    )

    return AuctionActivityOut(
        total=row.total,
        upcoming=row.upcoming,
        live=row.live,
        ended=row.total - row.upcoming - row.live,
        awarded=row.awarded,
        total_bids=total_bids or 0,
        weekly=[WeeklyCount(week=week, count=count) for week, count in weekly.all()],
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
