import uuid

from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, requires
from app.models.escrow import EscrowState
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.escrow import EscrowOut, EscrowPage
from app.services import escrow

router = APIRouter(prefix="/escrow", tags=["escrow"])

Manager = Depends(requires(Module.PAYMENT_ESCROW, Access.FULL))


@router.get("", response_model=EscrowPage)
async def list_escrows(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    state: EscrowState | None = None,
    _: User = Manager,
) -> EscrowPage:
    items, total = await escrow.paginate(session, page, size, state)
    return EscrowPage(
        items=[EscrowOut.of(item) for item in items], total=total, page=page, size=size
    )


@router.get("/{escrow_id}", response_model=EscrowOut)
async def get_escrow(escrow_id: uuid.UUID, session: DbSession, _: User = Manager) -> EscrowOut:
    return EscrowOut.of(await escrow.get(session, escrow_id))


@router.post("/{escrow_id}/advance", response_model=EscrowOut)
async def advance_escrow(escrow_id: uuid.UUID, session: DbSession, _: User = Manager) -> EscrowOut:
    """Move the settlement one step forward. Reaching RELEASED pays the seller."""
    return EscrowOut.of(await escrow.advance(session, escrow_id))
