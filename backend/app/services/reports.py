from datetime import UTC, datetime, timedelta
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import PropertyView
from app.models.auction import Auction, Bid
from app.models.campaign import Campaign, CampaignStatus
from app.models.category import Category
from app.models.escrow import Escrow
from app.models.lead import Lead, LeadStatus
from app.models.property import Property, PropertyStatus
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.schemas.report import (
    AiInsightsOut,
    AuctionActivityOut,
    BestSeller,
    BuyerActivity,
    CategoryCount,
    ConversionRatesOut,
    DashboardOut,
    MarketingPerformanceOut,
    MonthlyRevenueDetail,
    RevenueOut,
    SellerPerformance,
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
    direct_rows = (
        await session.execute(
            select(
                func.date_trunc("month", Property.purchased_at).label("month"),
                func.sum(Property.paid_amount),
                func.count(),
            )
            .where(Property.purchased_at.is_not(None), Property.purchased_at >= since)
            .group_by("month")
        )
    ).all()
    auction_rows = (
        await session.execute(
            select(
                func.date_trunc("month", Auction.ended_at).label("month"),
                func.sum(Property.reserve_price),
                func.count(),
            )
            .join(Property, Property.id == Auction.property_id)
            .where(Auction.winner_id.is_not(None), Auction.ended_at >= since)
            .group_by("month")
        )
    ).all()

    direct_by_month = {month: (amount, count) for month, amount, count in direct_rows}
    auction_by_month = {month: (amount, count) for month, amount, count in auction_rows}
    months = sorted(set(direct_by_month) | set(auction_by_month))

    monthly = [
        MonthlyRevenueDetail(
            month=month,
            amount=Decimal(auction_by_month.get(month, (Decimal(0), 0))[0])
            + Decimal(direct_by_month.get(month, (Decimal(0), 0))[0]),
            auction_amount=Decimal(auction_by_month.get(month, (Decimal(0), 0))[0]),
            direct_amount=Decimal(direct_by_month.get(month, (Decimal(0), 0))[0]),
            sales_count=auction_by_month.get(month, (Decimal(0), 0))[1]
            + direct_by_month.get(month, (Decimal(0), 0))[1],
        )
        for month in months
    ]

    return RevenueOut(
        total_revenue=Decimal(auction_rev or 0) + Decimal(direct_rev or 0),
        auction_revenue=Decimal(auction_rev or 0),
        direct_sales_revenue=Decimal(direct_rev or 0),
        sales_count=await _count(session, Property.status == PropertyStatus.SOLD),
        monthly=monthly,
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


async def seller_performance(session: AsyncSession) -> list[SellerPerformance]:
    """Per-seller: listings, sold count, average released payout, and success rate."""
    listings = (
        select(
            Property.seller_id.label("sid"),
            func.count().label("listings"),
            func.count().filter(Property.status == PropertyStatus.SOLD).label("sold"),
        )
        .where(Property.seller_id.is_not(None))
        .group_by(Property.seller_id)
        .subquery()
    )
    payouts = (
        select(Escrow.seller_id.label("sid"), func.avg(Escrow.amount).label("avg_amt"))
        .group_by(Escrow.seller_id)
        .subquery()
    )
    rows = await session.execute(
        select(
            User.id,
            User.full_name,
            listings.c.listings,
            listings.c.sold,
            func.coalesce(payouts.c.avg_amt, 0),
        )
        .join(listings, listings.c.sid == User.id)
        .outerjoin(payouts, payouts.c.sid == User.id)
        .order_by(listings.c.sold.desc())
    )
    return [
        SellerPerformance(
            seller_id=uid,
            seller_name=name,
            listings=lc,
            sold=sold,
            avg_sale_price=Decimal(avg_amt or 0),
            success_rate=round(sold / lc, 3) if lc else 0.0,
        )
        for uid, name, lc, sold, avg_amt in rows.all()
    ]


async def buyer_activity(session: AsyncSession) -> list[BuyerActivity]:
    """Per-buyer: bids placed, auctions won, and average spend."""
    bids = (
        select(Bid.bidder_id.label("bid"), func.count().label("bids"))
        .group_by(Bid.bidder_id)
        .subquery()
    )
    won = (
        select(Auction.winner_id.label("bid"), func.count().label("won"))
        .where(Auction.winner_id.is_not(None))
        .group_by(Auction.winner_id)
        .subquery()
    )
    spend = (
        select(Escrow.buyer_id.label("bid"), func.avg(Escrow.amount).label("avg_spend"))
        .group_by(Escrow.buyer_id)
        .subquery()
    )
    rows = await session.execute(
        select(
            User.id,
            User.full_name,
            bids.c.bids,
            func.coalesce(won.c.won, 0),
            func.coalesce(spend.c.avg_spend, 0),
        )
        .join(bids, bids.c.bid == User.id)
        .outerjoin(won, won.c.bid == User.id)
        .outerjoin(spend, spend.c.bid == User.id)
        .order_by(bids.c.bids.desc())
    )
    return [
        BuyerActivity(buyer_id=uid, buyer_name=name, bids=b, won=w, avg_spend=Decimal(av or 0))
        for uid, name, b, w, av in rows.all()
    ]


async def marketing_performance(session: AsyncSession) -> MarketingPerformanceOut:
    async def count(*where) -> int:
        return await session.scalar(select(func.count()).select_from(Campaign).where(*where)) or 0

    return MarketingPerformanceOut(
        total=await session.scalar(select(func.count()).select_from(Campaign)) or 0,
        sent=await count(Campaign.status == CampaignStatus.SENT),
        scheduled=await count(Campaign.status == CampaignStatus.SCHEDULED),
        draft=await count(Campaign.status == CampaignStatus.DRAFT),
    )


async def best_sellers(session: AsyncSession, limit: int) -> list[BestSeller]:
    """Top sold listings by final price, with the bid volume they drew."""
    bids = (
        select(Bid.auction_id.label("aid"), func.count().label("bids"))
        .group_by(Bid.auction_id)
        .subquery()
    )
    final_price = func.coalesce(Property.paid_amount, Property.reserve_price)
    rows = await session.execute(
        select(Property.id, Property.title, final_price, func.coalesce(bids.c.bids, 0))
        .outerjoin(Auction, Auction.property_id == Property.id)
        .outerjoin(bids, bids.c.aid == Auction.id)
        .where(Property.status == PropertyStatus.SOLD)
        .order_by(final_price.desc())
        .limit(limit)
    )
    return [
        BestSeller(property_id=pid, title=title, final_price=Decimal(price or 0), bid_count=count)
        for pid, title, price, count in rows.all()
    ]


async def ai_insights(session: AsyncSession) -> AiInsightsOut:
    """A deterministic platform summary drawn from live data (no external model)."""
    sold = await _count(session, Property.status == PropertyStatus.SOLD)
    published = await _count(session, Property.status == PropertyStatus.PUBLISHED)
    top = (
        await session.execute(
            select(Category.name, func.count())
            .join(Property, Property.category_id == Category.id)
            .group_by(Category.name)
            .order_by(func.count().desc())
            .limit(1)
        )
    ).first()
    highlights = [f"{sold} listings sold to date.", f"{published} listings currently live."]
    if top:
        highlights.append(f"'{top[0]}' is the most listed category ({top[1]} listings).")
    return AiInsightsOut(
        summary="Automated platform summary based on current data.", highlights=highlights
    )


async def conversion_rates(session: AsyncSession) -> ConversionRatesOut:
    """Funnel conversion: lead-to-buyer, browse-to-bid, and bid-to-win."""
    leads = await session.scalar(select(func.count()).select_from(Lead)) or 0
    won_leads = (
        await session.scalar(
            select(func.count()).select_from(Lead).where(Lead.status == LeadStatus.WON)
        )
        or 0
    )
    viewers = (
        await session.scalar(
            select(func.count(func.distinct(PropertyView.viewer_id))).where(
                PropertyView.viewer_id.is_not(None)
            )
        )
        or 0
    )
    bidders = await session.scalar(select(func.count(func.distinct(Bid.bidder_id)))) or 0
    total_bids = await session.scalar(select(func.count()).select_from(Bid)) or 0
    wins = (
        await session.scalar(
            select(func.count()).select_from(Auction).where(Auction.winner_id.is_not(None))
        )
        or 0
    )

    def pct(numerator: int, denominator: int) -> float:
        return round(100 * numerator / denominator, 1) if denominator else 0.0

    return ConversionRatesOut(
        lead_to_buyer=pct(won_leads, leads),
        browse_to_bid=pct(bidders, viewers),
        bid_to_win=pct(wins, total_bids),
    )
