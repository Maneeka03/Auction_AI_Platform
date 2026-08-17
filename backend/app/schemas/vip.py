import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.vip import (
    TIER2_RETURN_REFUND_LIMIT,
    VipProfile,
    VipTier,
    VipTokenTransaction,
    VipTokenTransactionKind,
)

TIER_LABELS: dict[VipTier, str] = {
    VipTier.NONE: "Standard",
    VipTier.TIER4: "Tier 4 (Lowest)",
    VipTier.TIER3: "Tier 3 (Bronze)",
    VipTier.TIER2: "Tier 2 (Titanium)",
    VipTier.TIER1: "Tier 1 (Black)",
}

TIER_BENEFITS: dict[VipTier, str] = {
    VipTier.NONE: "No VIP benefits yet.",
    VipTier.TIER4: "100 free complimentary auction item listings.",
    VipTier.TIER3: "5-10% cash rebate.",
    VipTier.TIER2: f"Up to {TIER2_RETURN_REFUND_LIMIT} item return and refund requests.",
    VipTier.TIER1: "Unlimited item returns and refunds.",
}


class VipTierInfo(BaseModel):
    tier: VipTier
    label: str
    benefit: str
    requirement: str


class VipProfileOut(BaseModel):
    user_id: uuid.UUID
    tier: VipTier
    tier_label: str
    token_balance: int
    item_view_count: int
    listings_completed_count: int
    free_listing_credits: int
    return_refund_requests_used: int
    tier1_active: bool
    tier1_last_purchase_at: datetime | None
    updated_at: datetime

    @classmethod
    def of(cls, profile: VipProfile, *, tier1_active: bool) -> "VipProfileOut":
        return cls(
            user_id=profile.user_id,
            tier=profile.tier,
            tier_label=TIER_LABELS[profile.tier],
            token_balance=profile.token_balance,
            item_view_count=profile.item_view_count,
            listings_completed_count=profile.listings_completed_count,
            free_listing_credits=profile.free_listing_credits,
            return_refund_requests_used=profile.return_refund_requests_used,
            tier1_active=tier1_active,
            tier1_last_purchase_at=profile.tier1_last_purchase_at,
            updated_at=profile.updated_at,
        )


class PurchaseTokensRequest(BaseModel):
    quantity: int = Field(gt=0, le=10_000)


class PayMembershipRequest(BaseModel):
    tier: VipTier


class TokenTransactionOut(BaseModel):
    id: uuid.UUID
    kind: VipTokenTransactionKind
    quantity: int
    balance_after: int
    property_id: uuid.UUID | None
    note: str | None
    created_at: datetime

    @classmethod
    def of(cls, tx: VipTokenTransaction) -> "TokenTransactionOut":
        return cls(
            id=tx.id,
            kind=tx.kind,
            quantity=tx.quantity,
            balance_after=tx.balance_after,
            property_id=tx.property_id,
            note=tx.note,
            created_at=tx.created_at,
        )


class TokenTransactionPage(BaseModel):
    items: list[TokenTransactionOut]
    total: int
    page: int
    size: int
