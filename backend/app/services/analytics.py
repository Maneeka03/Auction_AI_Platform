import uuid

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.analytics import PropertyView
from app.models.auction import Auction, Bid
from app.models.watchlist import WatchlistItem
from app.schemas.crm import PropertyAnalyticsOut
from app.services import properties


async def record_view(session: AsyncSession, property_id: uuid.UUID, viewer_id: uuid.UUID) -> None:
    await properties.get(session, property_id)  # 404s on an unknown property
    session.add(PropertyView(property_id=property_id, viewer_id=viewer_id))
    await session.commit()


async def for_property(session: AsyncSession, property_id: uuid.UUID) -> PropertyAnalyticsOut:
    await properties.get(session, property_id)
    views = await session.scalar(
        select(func.count())
        .select_from(PropertyView)
        .where(PropertyView.property_id == property_id)
    )
    unique = await session.scalar(
        select(func.count(func.distinct(PropertyView.viewer_id))).where(
            PropertyView.property_id == property_id, PropertyView.viewer_id.is_not(None)
        )
    )
    watchers = await session.scalar(
        select(func.count())
        .select_from(WatchlistItem)
        .where(WatchlistItem.property_id == property_id)
    )
    bids, bidders = (
        await session.execute(
            select(func.count(), func.count(func.distinct(Bid.bidder_id)))
            .select_from(Bid)
            .join(Auction, Auction.id == Bid.auction_id)
            .where(Auction.property_id == property_id)
        )
    ).one()

    return PropertyAnalyticsOut(
        property_id=property_id,
        views=views or 0,
        unique_viewers=unique or 0,
        watchlist_count=watchers or 0,
        bids=bids,
        bidders=bidders,
    )
