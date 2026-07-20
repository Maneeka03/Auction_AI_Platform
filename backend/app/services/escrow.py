import uuid
from decimal import Decimal

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.escrow import Escrow, EscrowState
from app.models.property import Property
from app.models.wallet import WalletEntryKind
from app.services import wallets

# Forward-only pipeline; RELEASED is terminal and is what actually pays the seller.
_NEXT = {
    EscrowState.FUNDS_LOCKED: EscrowState.ASSET_HELD,
    EscrowState.ASSET_HELD: EscrowState.AUTHENTICATED,
    EscrowState.AUTHENTICATED: EscrowState.RELEASED,
}


def open_for(
    session: AsyncSession,
    listing: Property,
    buyer_id: uuid.UUID,
    amount: Decimal,
    auction_id: uuid.UUID | None = None,
) -> None:
    """Record a completed sale's funds as locked in escrow. The caller commits."""
    session.add(
        Escrow(
            property_id=listing.id,
            buyer_id=buyer_id,
            seller_id=listing.seller_id,
            amount=amount,
            auction_id=auction_id,
        )
    )


async def get(session: AsyncSession, escrow_id: uuid.UUID) -> Escrow:
    escrow = await session.get(Escrow, escrow_id)
    if escrow is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "escrow_not_found", "Escrow not found.")
    return escrow


async def paginate(
    session: AsyncSession, page: int, size: int, state: EscrowState | None
) -> tuple[list[Escrow], int]:
    query = select(Escrow)
    if state:
        query = query.where(Escrow.state == state)

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(Escrow.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


async def advance(session: AsyncSession, escrow_id: uuid.UUID) -> Escrow:
    """Move an escrow one step forward. Reaching RELEASED pays the seller."""
    escrow = await get(session, escrow_id)
    nxt = _NEXT.get(escrow.state)
    if nxt is None:
        raise AppError(
            status.HTTP_409_CONFLICT, "escrow_settled", "This escrow has already been released."
        )

    escrow.state = nxt
    if nxt is EscrowState.RELEASED and escrow.seller_id is not None:
        await wallets.credit(
            session, escrow.seller_id, escrow.amount, WalletEntryKind.PAYOUT, escrow.auction_id
        )
    await session.commit()
    return escrow
