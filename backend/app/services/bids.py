import uuid
from decimal import Decimal

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.auction import AuctionInvite, AuctionStatus, Bid, RoomAccess
from app.models.notification import NotificationKind
from app.models.user import User
from app.models.wallet import WalletEntryKind
from app.rbac.permissions import Role
from app.services import auctions, kyc, notifications, wallets


async def place(session: AsyncSession, user: User, auction_id: uuid.UUID, amount: Decimal) -> Bid:
    if Role.BUYER not in user.roles:
        raise AppError(status.HTTP_403_FORBIDDEN, "forbidden", "Only buyers can place bids.")
    await kyc.require_verified(session, user.id)

    auction = await auctions.locked(session, auction_id)
    if auction.status is not AuctionStatus.LIVE:
        raise AppError(
            status.HTTP_409_CONFLICT, "auction_not_live", "This auction is not open for bidding."
        )
    if auction.room_access is RoomAccess.INVITE_ONLY and not await _invited(
        session, auction_id, user.id
    ):
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "not_invited",
            "This auction is open to invited bidders only.",
        )

    top = await session.scalar(select(func.max(Bid.amount)).where(Bid.auction_id == auction_id))
    floor = auction.minimum_bid(top)
    if amount < floor:
        raise AppError(
            status.HTTP_409_CONFLICT, "bid_too_low", f"The next bid must be at least {floor}."
        )

    # Auction is already locked above, so this wallet lock keeps the agreed auction-then-wallet
    # order. The bidder's own earlier bid on this auction is excluded: raising your own bid should
    # only cost you the difference, not a second full hold.
    hold = wallets.hold_for(auction, amount)
    wallet = await wallets.locked(session, user.id)
    if hold > await wallets.spendable(session, wallet, exclude_auction_id=auction_id):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "insufficient_funds",
            "Your wallet does not cover this bid. Add funds and try again.",
        )

    leader = await _leader(session, auction_id)
    bid = Bid(auction_id=auction_id, bidder_id=user.id, amount=amount)
    session.add(bid)
    wallets.log(session, user.id, WalletEntryKind.BID_HOLD, -hold, auction_id)
    if leader is not None and leader != user.id:
        notifications.push(
            session,
            leader,
            NotificationKind.OUTBID,
            f"You were outbid on {auction.listing.title}.",
            auction_id=auction_id,
        )

    await session.commit()
    await auctions.broadcast(session, auction_id, "bid")
    return bid


async def _leader(session: AsyncSession, auction_id: uuid.UUID) -> uuid.UUID | None:
    """Who is winning right now. Read before the new bid lands, so it is who gets outbid."""
    return await session.scalar(
        select(Bid.bidder_id)
        .where(Bid.auction_id == auction_id)
        .order_by(Bid.amount.desc())
        .limit(1)
    )


async def history(session: AsyncSession, auction_id: uuid.UUID) -> list[Bid]:
    await auctions.get(session, auction_id)
    rows = await session.scalars(
        select(Bid).where(Bid.auction_id == auction_id).order_by(Bid.amount.desc())
    )
    return list(rows)


async def _invited(session: AsyncSession, auction_id: uuid.UUID, user_id: uuid.UUID) -> bool:
    return await session.scalar(
        select(
            select(AuctionInvite)
            .where(AuctionInvite.auction_id == auction_id, AuctionInvite.user_id == user_id)
            .exists()
        )
    )
