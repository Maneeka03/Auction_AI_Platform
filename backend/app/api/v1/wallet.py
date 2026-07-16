from fastapi import APIRouter, Depends

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.wallet import TopUpRequest, WalletOut
from app.services import wallets

router = APIRouter(prefix="/wallet", tags=["wallet"])

Owner = Depends(requires(Module.PAYMENT_ESCROW, Access.FULL))


@router.get("", response_model=WalletOut)
async def read_wallet(session: DbSession, actor: User = Owner) -> WalletOut:
    wallet, held, available = await wallets.read(session, actor.id)
    return WalletOut(balance=wallet.balance, held=held, available=available)


@router.post("/top-up", response_model=WalletOut)
async def top_up_wallet(
    payload: TopUpRequest, session: DbSession, actor: User = Owner
) -> WalletOut:
    wallet = await wallets.top_up(session, actor.id, payload.amount)
    held = await wallets.held(session, actor.id)
    return WalletOut(balance=wallet.balance, held=held, available=wallet.balance - held)
