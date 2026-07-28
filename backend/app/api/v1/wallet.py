from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.wallet import TopUpRequest, WalletEntryOut, WalletOut, WithdrawRequest
from app.services import wallets

router = APIRouter(prefix="/wallet", tags=["wallet"])

Owner = Depends(requires(Module.PAYMENT_ESCROW, Access.FULL))


async def _summary(session: DbSession, user: User) -> WalletOut:
    wallet, held, available = await wallets.read(session, user.id)
    return WalletOut(balance=wallet.balance, held=held, available=available)


@router.get("", response_model=WalletOut)
async def read_wallet(session: DbSession, actor: User = Owner) -> WalletOut:
    return await _summary(session, actor)


@router.post("/top-up", response_model=WalletOut)
async def top_up_wallet(
    payload: TopUpRequest, session: DbSession, actor: User = Owner
) -> WalletOut:
    await wallets.top_up(session, actor.id, payload.amount)
    return await _summary(session, actor)


@router.post("/withdraw", response_model=WalletOut)
async def withdraw_from_wallet(
    payload: WithdrawRequest, session: DbSession, actor: User = Owner
) -> WalletOut:
    await wallets.withdraw(session, actor.id, payload.amount)
    return await _summary(session, actor)


@router.get("/transactions", response_model=list[WalletEntryOut])
async def list_transactions(
    session: DbSession,
    limit: int = Query(50, ge=1, le=200),
    actor: User = Owner,
) -> list[WalletEntryOut]:
    rows = await wallets.history(session, actor.id, limit)
    return [WalletEntryOut.of(entry, related_to) for entry, related_to in rows]
