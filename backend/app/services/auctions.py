import logging
import uuid
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import status
from redis.exceptions import RedisError
from sqlalchemy import ColumnElement, Row, Select, and_, func, not_, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import events
from app.core.errors import UNPROCESSABLE, AppError
from app.models.auction import Auction, AuctionInvite, AuctionStatus, Bid
from app.models.property import PropertyStatus
from app.models.user import User
from app.models.wallet import WalletEntryKind
from app.schemas.auction import AuctionOut, CreateAuctionRequest, UpdateAuctionRequest
from app.services import properties, wallets

logger = logging.getLogger(__name__)

# Fields an admin may no longer touch once bidding has opened. The client's rule is that the room
# filters are decided before the auction starts; the closing time stays editable throughout.
FROZEN_ONCE_LIVE = frozenset({"room_access", "increments"})

# An auction plus its headline numbers.
AuctionRow = tuple[Auction, Decimal | None, int]

_BIDS = (
    select(
        Bid.auction_id.label("auction_id"),
        func.max(Bid.amount).label("current_bid"),
        func.count(func.distinct(Bid.bidder_id)).label("bidder_count"),
    )
    .group_by(Bid.auction_id)
    .subquery()
)


def _open() -> ColumnElement[bool]:
    """SQL twin of Auction.status: an auction nobody has closed and whose clock has not run out."""
    return and_(Auction.ended_at.is_(None), Auction.ends_at > func.now())


def _status_filter(value: AuctionStatus) -> ColumnElement[bool]:
    if value is AuctionStatus.ENDED:
        return not_(_open())
    if value is AuctionStatus.LIVE:
        return and_(_open(), Auction.starts_at <= func.now())
    return and_(_open(), Auction.starts_at > func.now())


def _with_totals() -> Select[AuctionRow]:
    """Carries current bid and bidder count alongside each auction, so a listing costs one query."""
    return select(
        Auction,
        _BIDS.c.current_bid,
        func.coalesce(_BIDS.c.bidder_count, 0),
    ).outerjoin(_BIDS, _BIDS.c.auction_id == Auction.id)


async def broadcast(session: AsyncSession, auction_id: uuid.UUID, event: str) -> None:
    """Push the whole room state to every listener.

    Sending the full auction rather than a delta means a client never has to merge partial updates,
    and a reconnecting one is instantly correct. Call only after the change is committed.
    """
    auction = AuctionOut.of(*await detail(session, auction_id))
    try:
        await events.publish(
            events.auction_channel(auction_id),
            {"type": event, "auction": auction.model_dump(mode="json")},
        )
    except RedisError:
        # The write is already committed. Failing the caller here would report a placed bid as an
        # error and invite a retry; a room that misses a push re-syncs on its next snapshot.
        logger.warning("auction %s: %s broadcast failed", auction_id, event)


async def release_holds(session: AsyncSession, auction: Auction) -> None:
    """Log every bidder's hold coming back. Settling the auction is what frees the money itself."""
    rows = await session.execute(
        select(Bid.bidder_id, func.max(Bid.amount))
        .where(Bid.auction_id == auction.id)
        .group_by(Bid.bidder_id)
    )
    for bidder_id, top_bid in rows.all():
        wallets.log(
            session,
            bidder_id,
            WalletEntryKind.REFUND,
            wallets.hold_for(auction, top_bid),
            auction.id,
        )


async def locked(session: AsyncSession, auction_id: uuid.UUID) -> Auction:
    """Fetch an auction FOR UPDATE. Always lock the auction before any wallet."""
    result = await session.execute(
        select(Auction).where(Auction.id == auction_id).with_for_update()
    )
    auction = result.scalar_one_or_none()
    if auction is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "auction_not_found", "Auction not found.")
    return auction


async def get(session: AsyncSession, auction_id: uuid.UUID) -> Auction:
    auction = await session.get(Auction, auction_id)
    if auction is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "auction_not_found", "Auction not found.")
    return auction


async def detail(session: AsyncSession, auction_id: uuid.UUID) -> AuctionRow:
    row = (await session.execute(_with_totals().where(Auction.id == auction_id))).first()
    if row is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "auction_not_found", "Auction not found.")
    return row[0], row[1], row[2]


async def create(session: AsyncSession, data: CreateAuctionRequest) -> Auction:
    listing = await properties.get(session, data.property_id)
    if listing.status is not PropertyStatus.PUBLISHED:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "property_not_published",
            "Only a published property can be put up for auction.",
        )

    running = await session.scalar(
        select(func.count()).select_from(Auction).where(Auction.property_id == listing.id, _open())
    )
    if running:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "auction_already_running",
            "This property already has an auction that has not ended.",
        )

    auction = Auction(
        property_id=listing.id,
        starts_at=data.starts_at,
        ends_at=data.ends_at,
        opening_bid=data.opening_bid,
        reserve_price=data.reserve_price,
        room_access=data.room_access,
        increments=data.increments,
        token_percent=data.token_percent,
    )
    session.add(auction)
    await session.commit()
    return auction


async def paginate(
    session: AsyncSession, page: int, size: int, auction_status: AuctionStatus | None
) -> tuple[list[AuctionRow], int]:
    query = _with_totals()
    count_query = select(func.count()).select_from(Auction)
    if auction_status:
        condition = _status_filter(auction_status)
        query = query.where(condition)
        count_query = count_query.where(condition)

    total = await session.scalar(count_query) or 0
    rows = await session.execute(
        query.order_by(Auction.starts_at.desc()).offset((page - 1) * size).limit(size)
    )
    return [(row[0], row[1], row[2]) for row in rows.all()], total


async def update(
    session: AsyncSession, auction_id: uuid.UUID, data: UpdateAuctionRequest
) -> Auction:
    auction = await locked(session, auction_id)
    if auction.status is AuctionStatus.ENDED:
        raise AppError(status.HTTP_409_CONFLICT, "auction_ended", "This auction has ended.")

    # Every updatable column is NOT NULL, so an omitted field and an explicit null both mean
    # "leave it alone" rather than "write NULL and crash".
    fields = data.model_dump(exclude_none=True)
    if auction.status is not AuctionStatus.UPCOMING and FROZEN_ONCE_LIVE.intersection(fields):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "auction_live",
            "Room access and bid increments are fixed once bidding has opened.",
        )

    new_end = fields.get("ends_at")
    if new_end is not None and new_end <= max(auction.starts_at, datetime.now(UTC)):
        raise AppError(
            UNPROCESSABLE,
            "invalid_ends_at",
            "The closing time must be later than both the start time and now.",
        )

    for field, value in fields.items():
        setattr(auction, field, value)

    await session.commit()
    await broadcast(session, auction_id, "updated")
    return auction


async def invite(session: AsyncSession, auction_id: uuid.UUID, user_ids: list[uuid.UUID]) -> None:
    auction = await get(session, auction_id)
    if auction.status is AuctionStatus.ENDED:
        raise AppError(status.HTTP_409_CONFLICT, "auction_ended", "This auction has ended.")

    try:
        # Postgres rejects an unknown user_id on the INSERT itself, not at commit.
        await session.execute(
            pg_insert(AuctionInvite)
            .values([{"auction_id": auction_id, "user_id": user_id} for user_id in set(user_ids)])
            .on_conflict_do_nothing()
        )
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            UNPROCESSABLE, "unknown_user", "One or more of those users do not exist."
        ) from None


async def participants(session: AsyncSession, auction_id: uuid.UUID) -> list[Row]:
    await get(session, auction_id)
    rows = await session.execute(
        select(
            User.id.label("user_id"),
            User.full_name,
            User.email,
            func.max(Bid.amount).label("top_bid"),
            func.count().label("bid_count"),
            func.max(Bid.created_at).label("last_bid_at"),
        )
        .join(Bid, Bid.bidder_id == User.id)
        .where(Bid.auction_id == auction_id)
        .group_by(User.id, User.full_name, User.email)
        .order_by(func.max(Bid.amount).desc())
    )
    return list(rows.all())


async def award(session: AsyncSession, auction_id: uuid.UUID, bidder_id: uuid.UUID) -> Auction:
    """Sell to a bidder of the admin's choosing - not necessarily the highest one."""
    auction = await locked(session, auction_id)
    if auction.winner_id is not None:
        raise AppError(
            status.HTTP_409_CONFLICT, "already_awarded", "This auction has already been awarded."
        )

    winning_bid = await session.scalar(
        select(func.max(Bid.amount)).where(Bid.auction_id == auction_id, Bid.bidder_id == bidder_id)
    )
    if winning_bid is None:
        raise AppError(
            status.HTTP_409_CONFLICT, "not_a_bidder", "That user has not bid on this auction."
        )

    # Auction is locked above, so taking the wallet second matches bids.place and cannot deadlock.
    charge = wallets.hold_for(auction, winning_bid)
    wallet = await wallets.locked(session, bidder_id)
    if charge > await wallets.spendable(session, wallet, exclude_auction_id=auction_id):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "insufficient_funds",
            "The winner no longer has the funds to cover this bid.",
        )

    wallet.balance -= charge
    auction.winner_id = bidder_id
    auction.ended_at = datetime.now(UTC)
    auction.listing.status = PropertyStatus.SOLD

    # Every hold closes, including the winner's, then the winner is charged - so the log nets to
    # zero for a loser and to the price for the winner.
    await release_holds(session, auction)
    wallets.log(session, bidder_id, WalletEntryKind.PURCHASE, -charge, auction_id)
    await session.commit()
    await broadcast(session, auction_id, "ended")
    return auction


async def end(session: AsyncSession, auction_id: uuid.UUID) -> Auction:
    """Close a room with no sale. Every bidder's funds unlock as a result."""
    auction = await locked(session, auction_id)
    if auction.status is AuctionStatus.ENDED:
        raise AppError(status.HTTP_409_CONFLICT, "auction_ended", "This auction has ended.")

    auction.ended_at = datetime.now(UTC)
    await release_holds(session, auction)
    await session.commit()
    await broadcast(session, auction_id, "ended")
    return auction
