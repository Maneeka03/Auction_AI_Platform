import uuid
from datetime import UTC, datetime

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.models.vip import VipTier
from app.services import vip
from app.services.vip import tier1_active
from app.schemas.vip import (
    PayMembershipRequest,
    PurchaseTokensRequest,
    TIER_BENEFITS,
    TIER_LABELS,
    TokenTransactionOut,
    TokenTransactionPage,
    VipProfileOut,
    VipTierInfo,
)

router = APIRouter(prefix="/vip", tags=["vip"])


@router.get("/tiers", response_model=list[VipTierInfo])
async def tier_ladder() -> list[VipTierInfo]:
    """Static reference info for the tier ladder (Side Note D). No auth required - shown to
    prospective buyers/sellers to explain the program."""
    requirements = {
        VipTier.NONE: "Default tier.",
        VipTier.TIER4: "Reach 10,000 auction item views.",
        VipTier.TIER3: "Complete 1,000 listings.",
        VipTier.TIER2: "Pay the Tier 2 membership fee, or purchase an item over HK$100,000.",
        VipTier.TIER1: "Pay the Tier 1 membership fee; purchase at least 1 item every 3 months.",
    }
    return [
        VipTierInfo(
            tier=t, label=TIER_LABELS[t], benefit=TIER_BENEFITS[t], requirement=requirements[t]
        )
        for t in VipTier
    ]


@router.get("/me", response_model=VipProfileOut)
async def my_profile(session: DbSession, actor: CurrentUser) -> VipProfileOut:
    profile = await vip.get_or_create_profile(session, actor.id)
    return VipProfileOut.of(profile, tier1_active=tier1_active(profile, datetime.now(UTC)))


@router.post("/tokens/purchase", response_model=VipProfileOut)
async def purchase_tokens(
    payload: PurchaseTokensRequest, session: DbSession, actor: CurrentUser
) -> VipProfileOut:
    profile = await vip.purchase_tokens(session, actor.id, payload.quantity)
    return VipProfileOut.of(profile, tier1_active=tier1_active(profile, datetime.now(UTC)))


@router.get("/tokens/transactions", response_model=TokenTransactionPage)
async def my_transactions(
    session: DbSession,
    actor: CurrentUser,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
) -> TokenTransactionPage:
    items, total = await vip.list_transactions(session, actor.id, page, size)
    return TokenTransactionPage(
        items=[TokenTransactionOut.of(item) for item in items], total=total, page=page, size=size
    )


@router.post("/membership", response_model=VipProfileOut)
async def pay_membership(
    payload: PayMembershipRequest, session: DbSession, actor: CurrentUser
) -> VipProfileOut:
    profile = await vip.pay_membership(session, actor.id, payload.tier)
    return VipProfileOut.of(profile, tier1_active=tier1_active(profile, datetime.now(UTC)))


@router.post("/items/{property_id}/view", response_model=VipProfileOut)
async def spend_token_to_view(
    property_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> VipProfileOut:
    """Spends one viewing token to view a gated auction item detail (Side Note D: "Viewing each
    auction item requires the purchase and use of a virtual token")."""
    profile = await vip.spend_token_to_view(session, actor.id, property_id)
    return VipProfileOut.of(profile, tier1_active=tier1_active(profile, datetime.now(UTC)))
