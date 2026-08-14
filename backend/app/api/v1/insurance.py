import uuid

from fastapi import APIRouter, Depends

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.insurance import (
    InsuranceQuoteOut,
    InsurancePolicyOut,
    SelectQuoteRequest,
)
from app.services import escrow as escrow_service
from app.services import insurance

router = APIRouter(prefix="/escrow/{escrow_id}/insurance", tags=["insurance"])

# Insurance selection/purchase happens as part of settling a sale, so it shares the escrow
# module's staff-only access rather than introducing a new RBAC module for it.
Manager = Depends(requires(Module.PAYMENT_ESCROW, Access.FULL))


@router.get("/quotes", response_model=list[InsuranceQuoteOut])
async def quotes(escrow_id: uuid.UUID, session: DbSession, _: User = Manager) -> list[InsuranceQuoteOut]:
    """Live/dynamic quotes from every configured third-party provider (Side Note B)."""
    escrow = await escrow_service.get(session, escrow_id)
    return [InsuranceQuoteOut.of(q) for q in insurance.list_quotes(escrow.amount)]


@router.post("/select", response_model=InsurancePolicyOut)
async def select_quote(
    escrow_id: uuid.UUID, payload: SelectQuoteRequest, session: DbSession, _: User = Manager
) -> InsurancePolicyOut:
    escrow = await escrow_service.get(session, escrow_id)
    policy = await insurance.select_quote(
        session, escrow_id, payload.provider_name, escrow.amount
    )
    return InsurancePolicyOut.of(policy)


@router.post("/purchase", response_model=InsurancePolicyOut)
async def purchase(escrow_id: uuid.UUID, session: DbSession, _: User = Manager) -> InsurancePolicyOut:
    """Marks the selected policy as paid, satisfying the mandatory-insurance gate on release."""
    policy = await insurance.purchase_policy(session, escrow_id)
    return InsurancePolicyOut.of(policy)
