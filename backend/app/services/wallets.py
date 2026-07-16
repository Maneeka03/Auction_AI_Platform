import uuid
from decimal import ROUND_HALF_UP, Decimal

from sqlalchemy import func, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.auction import Auction, Bid
from app.models.wallet import Wallet

CENTS = Decimal("0.01")


def hold_for(auction: Auction, amount: Decimal) -> Decimal:
    """The slice of a bid that has to be free in the wallet to place it."""
    return (amount * auction.token_percent / 100).quantize(CENTS, rounding=ROUND_HALF_UP)


async def locked(session: AsyncSession, user_id: uuid.UUID) -> Wallet:
    """Fetch the user's wallet FOR UPDATE, creating it on first use.

    Callers that also lock an auction must lock the auction FIRST - a consistent order across
    place_bid and award is what keeps two concurrent bidders from deadlocking each other.
    """
    await session.execute(
        pg_insert(Wallet).values(user_id=user_id).on_conflict_do_nothing(index_elements=["user_id"])
    )
    result = await session.execute(
        select(Wallet).where(Wallet.user_id == user_id).with_for_update()
    )
    return result.scalar_one()


async def held(
    session: AsyncSession, user_id: uuid.UUID, exclude_auction_id: uuid.UUID | None = None
) -> Decimal:
    """Funds locked by this user's unresolved bids.

    A bidder's exposure on an auction is their own highest bid on it, never the sum of their bids.

    Only auctions an admin has not settled count. Money is released by the award (or by ending the
    auction with no sale), never by the clock running out - otherwise the winner of an expired
    auction could spend what they owe in the window before the admin picks them. A loser therefore
    needs no refund step: the settlement stops counting their bid against them.
    """
    top = (
        select(Bid.auction_id.label("auction_id"), func.max(Bid.amount).label("amount"))
        .where(Bid.bidder_id == user_id)
        .group_by(Bid.auction_id)
        .subquery()
    )
    query = (
        # Rounded per auction, exactly as hold_for rounds each bid, so the two never drift apart.
        select(
            func.coalesce(func.sum(func.round(top.c.amount * Auction.token_percent / 100, 2)), 0)
        )
        .select_from(top)
        .join(Auction, Auction.id == top.c.auction_id)
        .where(Auction.ended_at.is_(None))
    )
    if exclude_auction_id is not None:
        query = query.where(Auction.id != exclude_auction_id)

    total: Decimal = await session.scalar(query)
    return total.quantize(CENTS, rounding=ROUND_HALF_UP)


async def spendable(
    session: AsyncSession, wallet: Wallet, exclude_auction_id: uuid.UUID | None = None
) -> Decimal:
    return wallet.balance - await held(session, wallet.user_id, exclude_auction_id)


async def read(session: AsyncSession, user_id: uuid.UUID) -> tuple[Wallet, Decimal, Decimal]:
    wallet = await locked(session, user_id)
    await session.commit()
    locked_funds = await held(session, user_id)
    return wallet, locked_funds, wallet.balance - locked_funds


async def top_up(session: AsyncSession, user_id: uuid.UUID, amount: Decimal) -> Wallet:
    wallet = await locked(session, user_id)
    wallet.balance += amount
    await session.commit()
    return wallet
