import uuid
from decimal import Decimal

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auction import Auction, Bid
from app.models.escrow import Escrow, EscrowState
from app.models.kyc import KycStatus, KycSubmission
from app.models.property import Property
from app.models.watchlist import WatchlistItem
from app.schemas.portal import BuyerDashboardOut, DocumentVerificationOut, SellerDashboardOut


async def buyer_dashboard(session: AsyncSession, buyer_id: uuid.UUID) -> BuyerDashboardOut:
    active_bids = await session.scalar(
        select(func.count(func.distinct(Bid.auction_id)))
        .select_from(Bid)
        .join(Auction, Auction.id == Bid.auction_id)
        .where(Bid.bidder_id == buyer_id, Auction.ended_at.is_(None), Auction.ends_at > func.now())
    )
    watchlist = await session.scalar(
        select(func.count()).select_from(WatchlistItem).where(WatchlistItem.user_id == buyer_id)
    )
    won = await session.scalar(
        select(func.count()).select_from(Auction).where(Auction.winner_id == buyer_id)
    )
    purchases = await session.scalar(
        select(func.count()).select_from(Escrow).where(Escrow.buyer_id == buyer_id)
    )
    return BuyerDashboardOut(
        active_bids=active_bids or 0,
        watchlist=watchlist or 0,
        won_auctions=won or 0,
        purchases=purchases or 0,
    )


async def seller_dashboard(session: AsyncSession, seller_id: uuid.UUID) -> SellerDashboardOut:
    listings = await session.scalar(
        select(func.count()).select_from(Property).where(Property.seller_id == seller_id)
    )
    active = await session.scalar(
        select(func.count())
        .select_from(Auction)
        .join(Property, Property.id == Auction.property_id)
        .where(
            Property.seller_id == seller_id,
            Auction.ended_at.is_(None),
            Auction.ends_at > func.now(),
            Auction.starts_at <= func.now(),
        )
    )
    earnings = await session.scalar(
        select(func.coalesce(func.sum(Escrow.amount), 0)).where(
            Escrow.seller_id == seller_id, Escrow.state == EscrowState.RELEASED
        )
    )
    pending = await session.scalar(
        select(func.coalesce(func.sum(Escrow.amount), 0)).where(
            Escrow.seller_id == seller_id, Escrow.state != EscrowState.RELEASED
        )
    )
    return SellerDashboardOut(
        total_listings=listings or 0,
        active_auctions=active or 0,
        total_earnings=Decimal(earnings or 0),
        pending_payouts=Decimal(pending or 0),
    )


async def document_verification(session: AsyncSession) -> DocumentVerificationOut:
    """Combined KYC and escrow verification status across the platform (staff oversight)."""

    async def kyc(kyc_status: KycStatus) -> int:
        return (
            await session.scalar(
                select(func.count())
                .select_from(KycSubmission)
                .where(KycSubmission.status == kyc_status)
            )
            or 0
        )

    async def escrow(released: bool) -> int:
        condition = (
            Escrow.state == EscrowState.RELEASED
            if released
            else Escrow.state != EscrowState.RELEASED
        )
        return await session.scalar(select(func.count()).select_from(Escrow).where(condition)) or 0

    return DocumentVerificationOut(
        kyc_pending=await kyc(KycStatus.PENDING),
        kyc_approved=await kyc(KycStatus.APPROVED),
        kyc_rejected=await kyc(KycStatus.REJECTED),
        escrow_open=await escrow(False),
        escrow_released=await escrow(True),
    )
