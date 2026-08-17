"""VIP tier rankings & the virtual-token viewing system.

Source: 13 Jul clarifications follow-up, "Side Note D: Overview of VIP Tier Rankings & Token
System". The client explicitly allowed deferring this to Phase 2 if too complex; this is a
best-effort v1 of what was specified, kept self-contained so it does not block any core flow.

Tier thresholds, verbatim from the client:
  Tier 4 (Lowest)  - 10,000 auction item views            -> 100 free listings
  Tier 3 (Bronze)  - 1,000 completed listings              -> 5-10% cash rebate
  Tier 2 (Titanium)- membership fee OR a purchase > HK$100,000 -> up to 3 returns/refunds
  Tier 1 (Black)   - membership fee; must buy >=1 item every 3 months to stay active
                                                             -> unlimited returns/refunds

Open item, explicitly flagged by the client: Tier 4's view count should "ideally" be verified via
a human-only check (bot filtering). No such check is specced yet, so `record_item_view` below
trusts the caller; a later pass should add bot/rate-limit filtering before it counts toward tier.
"""

import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Integer, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum

# HK$100,000 purchase threshold that alone qualifies a buyer for Tier 2. Matches the same
# threshold used for VIP in-person viewing requests (Side Note C) - the platform has one
# high-value cutoff, not two.
HIGH_VALUE_PURCHASE_THRESHOLD = 100_000

TIER4_VIEW_THRESHOLD = 10_000
TIER3_LISTINGS_THRESHOLD = 1_000
TIER1_RENEWAL_WINDOW_DAYS = 90  # "at least 1 item every 3 months"
TIER4_FREE_LISTING_GRANT = 100
TIER2_RETURN_REFUND_LIMIT = 3


class VipTier(StrEnum):
    NONE = "none"
    TIER4 = "tier4"  # Lowest
    TIER3 = "tier3"  # Bronze
    TIER2 = "tier2"  # Titanium
    TIER1 = "tier1"  # Black, highest


class VipTokenTransactionKind(StrEnum):
    PURCHASE = "purchase"  # buyer pays for tokens
    SPEND_VIEW = "spend_view"  # one token consumed to view one auction item
    ADMIN_GRANT = "admin_grant"  # staff-issued adjustment (goodwill credit, correction, etc.)


class VipProfile(Base, TimestampMixin):
    """One row per user. Created lazily the first time any VIP action touches that user."""

    __tablename__ = "vip_profiles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    tier: Mapped[VipTier] = mapped_column(pg_enum(VipTier, "vip_tier"), default=VipTier.NONE)

    token_balance: Mapped[int] = mapped_column(Integer, default=0)
    item_view_count: Mapped[int] = mapped_column(Integer, default=0)
    listings_completed_count: Mapped[int] = mapped_column(Integer, default=0)
    free_listing_credits: Mapped[int] = mapped_column(Integer, default=0)
    return_refund_requests_used: Mapped[int] = mapped_column(Integer, default=0)

    tier1_membership_paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    # Renewal clock for Tier 1: last time they purchased ANY item. Must stay within 90 days.
    tier1_last_purchase_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    tier2_membership_paid_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    # Set instead of tier2_membership_paid_at when Tier 2 is earned via a high-value purchase.
    tier2_qualified_by_purchase_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )

    user: Mapped["User"] = relationship(lazy="selectin")  # noqa: F821


class VipTokenTransaction(Base):
    """An immutable log of every token grant/spend, so a balance is always auditable."""

    __tablename__ = "vip_token_transactions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[VipTokenTransactionKind] = mapped_column(
        pg_enum(VipTokenTransactionKind, "vip_token_transaction_kind")
    )
    quantity: Mapped[int] = mapped_column(Integer)  # signed: +N for grants, -1 for a view spend
    balance_after: Mapped[int] = mapped_column(Integer)
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("properties.id", ondelete="SET NULL"), default=None
    )
    note: Mapped[str | None] = mapped_column(String(200), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
