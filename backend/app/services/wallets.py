import uuid
from decimal import ROUND_HALF_UP, Decimal

from fastapi import status
from sqlalchemy import func, select, update
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.auction import Auction, Bid
from app.models.property import Property
from app.models.wallet import Wallet, WalletEntry, WalletEntryKind
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role

CENTS = Decimal("0.01")


def hold_for(auction: Auction, amount: Decimal) -> Decimal:
    """The slice of a bid that has to be free in the wallet to place it."""
    return (amount * auction.token_percent / 100).quantize(CENTS, rounding=ROUND_HALF_UP)


def log(
    session: AsyncSession,
    user_id: uuid.UUID,
    kind: WalletEntryKind,
    amount: Decimal,
    auction_id: uuid.UUID | None = None,
) -> None:
    """Record activity for the user to read. Never read back to compute a balance."""
    session.add(WalletEntry(user_id=user_id, kind=kind, amount=amount, auction_id=auction_id))


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

async def list_buyers(
    session: AsyncSession, page: int, size: int, search: str | None
) -> tuple[list[tuple[User, Decimal, Decimal]], int]:
    """Every buyer with their wallet balance and current held-for-bids exposure.

    Mirrors held()'s own logic (highest bid per still-open auction, rounded per auction) but
    computed for every buyer in one query rather than one call per row.
    """
    base = select(User).where(
        User.status != UserStatus.DELETED, User.role_rows.any(UserRole.role == Role.BUYER)
    )
    if search:
        pattern = f"%{search.lower()}%"
        base = base.where(
            func.lower(User.email).like(pattern) | func.lower(User.full_name).like(pattern)
        )

    total = await session.scalar(select(func.count()).select_from(base.subquery())) or 0

    top = (
        select(
            Bid.bidder_id.label("bidder_id"),
            Bid.auction_id.label("auction_id"),
            func.max(Bid.amount).label("amount"),
        )
        .group_by(Bid.bidder_id, Bid.auction_id)
        .subquery()
    )
    held_per_user = (
        select(
            top.c.bidder_id.label("uid"),
            func.coalesce(
                func.sum(func.round(top.c.amount * Auction.token_percent / 100, 2)), 0
            ).label("held"),
        )
        .select_from(top)
        .join(Auction, Auction.id == top.c.auction_id)
        .where(Auction.ended_at.is_(None))
        .group_by(top.c.bidder_id)
        .subquery()
    )

    rows = await session.execute(
        base.add_columns(func.coalesce(Wallet.balance, 0), func.coalesce(held_per_user.c.held, 0))
        .outerjoin(Wallet, Wallet.user_id == User.id)
        .outerjoin(held_per_user, held_per_user.c.uid == User.id)
        .order_by(User.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return [(row[0], row[1], row[2]) for row in rows.all()], total

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
    log(session, user_id, WalletEntryKind.DEPOSIT, amount)
    await session.commit()
    return wallet


async def withdraw(session: AsyncSession, user_id: uuid.UUID, amount: Decimal) -> Wallet:
    wallet = await locked(session, user_id)
    # Only unlocked money can leave: funds behind a live bid are already committed to it.
    if amount > await spendable(session, wallet):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "insufficient_funds",
            "You cannot withdraw more than your available balance.",
        )

    wallet.balance -= amount
    log(session, user_id, WalletEntryKind.WITHDRAWAL, -amount)
    await session.commit()
    return wallet


async def credit(
    session: AsyncSession,
    user_id: uuid.UUID,
    amount: Decimal,
    kind: WalletEntryKind,
    auction_id: uuid.UUID | None = None,
) -> None:
    """Pay money into a user's wallet with a single atomic UPDATE, taking no row lock.

    A settlement that already holds the buyer's wallet locked can credit the seller through this
    without risking a lock-ordering deadlock. The wallet is created first if the seller had none.
    """
    await session.execute(
        pg_insert(Wallet).values(user_id=user_id).on_conflict_do_nothing(index_elements=["user_id"])
    )
    await session.execute(
        update(Wallet).where(Wallet.user_id == user_id).values(balance=Wallet.balance + amount)
    )
    log(session, user_id, kind, amount, auction_id)


async def history(
    session: AsyncSession, user_id: uuid.UUID, limit: int
) -> list[tuple[WalletEntry, str | None]]:
    """Newest first, each entry paired with the property title it relates to, when it has one."""
    rows = await session.execute(
        select(WalletEntry, Property.title)
        .outerjoin(Auction, Auction.id == WalletEntry.auction_id)
        .outerjoin(Property, Property.id == Auction.property_id)
        .where(WalletEntry.user_id == user_id)
        .order_by(WalletEntry.created_at.desc())
        .limit(limit)
    )
    return [(row[0], row[1]) for row in rows.all()]
