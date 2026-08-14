import uuid
from datetime import UTC, datetime, timedelta

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.property import Property
from app.models.vip import (
    HIGH_VALUE_PURCHASE_THRESHOLD,
    TIER1_RENEWAL_WINDOW_DAYS,
    TIER2_RETURN_REFUND_LIMIT,
    TIER3_LISTINGS_THRESHOLD,
    TIER4_FREE_LISTING_GRANT,
    TIER4_VIEW_THRESHOLD,
    VipProfile,
    VipTier,
    VipTokenTransaction,
    VipTokenTransactionKind,
)


async def get_or_create_profile(session: AsyncSession, user_id: uuid.UUID) -> VipProfile:
    profile = await session.get(VipProfile, user_id)
    if profile is None:
        profile = VipProfile(user_id=user_id)
        session.add(profile)
        await session.flush()
    return profile


def tier1_active(profile: VipProfile, now: datetime) -> bool:
    if profile.tier1_membership_paid_at is None:
        return False
    last_purchase = profile.tier1_last_purchase_at or profile.tier1_membership_paid_at
    return now - last_purchase <= timedelta(days=TIER1_RENEWAL_WINDOW_DAYS)


def recompute_tier(profile: VipProfile, now: datetime | None = None) -> VipTier:
    """Pure function: derives the tier a profile currently qualifies for.

    Higher tiers are not "unlocked and kept forever" for Tier 1 - it lapses without a purchase
    every 90 days, per the client's renewal rule. Every other tier, once reached, is permanent
    (the client gave no lapse rule for tiers 2-4).
    """
    now = now or datetime.now(UTC)

    if tier1_active(profile, now):
        return VipTier.TIER1
    if profile.tier2_membership_paid_at is not None or profile.tier2_qualified_by_purchase_at:
        return VipTier.TIER2
    if profile.listings_completed_count >= TIER3_LISTINGS_THRESHOLD:
        return VipTier.TIER3
    if profile.item_view_count >= TIER4_VIEW_THRESHOLD:
        return VipTier.TIER4
    return VipTier.NONE


async def _refresh_tier(session: AsyncSession, profile: VipProfile) -> VipProfile:
    previous = profile.tier
    profile.tier = recompute_tier(profile)
    # Tier 4 grants a one-time bundle of free listings the moment it's first reached.
    if previous != VipTier.TIER4 and profile.tier == VipTier.TIER4:
        profile.free_listing_credits += TIER4_FREE_LISTING_GRANT
    await session.flush()
    return profile


async def _log_transaction(
    session: AsyncSession,
    profile: VipProfile,
    kind: VipTokenTransactionKind,
    quantity: int,
    *,
    property_id: uuid.UUID | None = None,
    note: str | None = None,
) -> None:
    session.add(
        VipTokenTransaction(
            id=uuid.uuid4(),
            user_id=profile.user_id,
            kind=kind,
            quantity=quantity,
            balance_after=profile.token_balance,
            property_id=property_id,
            note=note,
        )
    )


async def purchase_tokens(session: AsyncSession, user_id: uuid.UUID, quantity: int) -> VipProfile:
    """Buys `quantity` viewing tokens.

    Payment collection itself is out of scope here (client's payments module - crypto/VATP
    licensing question, section 2 - is still pending legal sign-off); this records the grant as
    if payment already cleared, matching how the rest of this codebase's stub flows work.
    """
    if quantity <= 0:
        raise AppError(status.HTTP_400_BAD_REQUEST, "invalid_quantity", "Quantity must be positive.")

    profile = await get_or_create_profile(session, user_id)
    profile.token_balance += quantity
    await _log_transaction(
        session, profile, VipTokenTransactionKind.PURCHASE, quantity, note="Token purchase"
    )
    await session.commit()
    await session.refresh(profile)
    return profile


async def spend_token_to_view(
    session: AsyncSession, user_id: uuid.UUID, property_id: uuid.UUID
) -> VipProfile:
    """Consumes one token to view one auction item, per the client's token-gated viewing rule."""
    listing = await session.get(Property, property_id)
    if listing is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "property_not_found", "Listing not found.")

    profile = await get_or_create_profile(session, user_id)
    if profile.token_balance <= 0:
        raise AppError(
            status.HTTP_402_PAYMENT_REQUIRED,
            "no_tokens",
            "You need a viewing token to view this item. Purchase tokens to continue.",
        )

    profile.token_balance -= 1
    profile.item_view_count += 1
    await _log_transaction(
        session,
        profile,
        VipTokenTransactionKind.SPEND_VIEW,
        -1,
        property_id=property_id,
        note="Item view",
    )
    await _refresh_tier(session, profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def record_listing_completed(session: AsyncSession, user_id: uuid.UUID) -> VipProfile:
    """Call when a seller's listing sells through (Tier 3's "1,000 listings" counter)."""
    profile = await get_or_create_profile(session, user_id)
    profile.listings_completed_count += 1
    await _refresh_tier(session, profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def record_purchase(
    session: AsyncSession, user_id: uuid.UUID, amount, now: datetime | None = None
) -> VipProfile:
    """Call when a buyer completes a purchase. Feeds the Tier 1 renewal clock and can qualify
    Tier 2 outright on a single purchase over HK$100,000."""
    now = now or datetime.now(UTC)
    profile = await get_or_create_profile(session, user_id)
    profile.tier1_last_purchase_at = now
    if amount is not None and amount > HIGH_VALUE_PURCHASE_THRESHOLD:
        profile.tier2_qualified_by_purchase_at = profile.tier2_qualified_by_purchase_at or now
    await _refresh_tier(session, profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def pay_membership(session: AsyncSession, user_id: uuid.UUID, tier: VipTier) -> VipProfile:
    """Records payment of the Tier 1 or Tier 2 membership fee. Payment collection is stubbed,
    same caveat as purchase_tokens."""
    if tier not in (VipTier.TIER1, VipTier.TIER2):
        raise AppError(
            status.HTTP_400_BAD_REQUEST,
            "invalid_tier",
            "Only Tier 1 and Tier 2 are paid memberships.",
        )
    now = datetime.now(UTC)
    profile = await get_or_create_profile(session, user_id)
    if tier == VipTier.TIER1:
        profile.tier1_membership_paid_at = now
        profile.tier1_last_purchase_at = profile.tier1_last_purchase_at or now
    else:
        profile.tier2_membership_paid_at = now
    await _refresh_tier(session, profile)
    await session.commit()
    await session.refresh(profile)
    return profile


async def use_return_or_refund(session: AsyncSession, user_id: uuid.UUID) -> VipProfile:
    """Enforces the tier-based return/refund cap: Tier 2 gets up to 3, Tier 1 is unlimited,
    everyone else gets none through this VIP allowance."""
    profile = await get_or_create_profile(session, user_id)
    if profile.tier == VipTier.TIER1:
        pass  # unlimited
    elif profile.tier == VipTier.TIER2:
        if profile.return_refund_requests_used >= TIER2_RETURN_REFUND_LIMIT:
            raise AppError(
                status.HTTP_409_CONFLICT,
                "return_limit_reached",
                "You have used all of your Tier 2 return/refund requests.",
            )
    else:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "not_eligible",
            "Return/refund requests through VIP tiers require Tier 2 or Tier 1.",
        )
    profile.return_refund_requests_used += 1
    await session.commit()
    await session.refresh(profile)
    return profile


async def list_transactions(
    session: AsyncSession, user_id: uuid.UUID, page: int, size: int
) -> tuple[list[VipTokenTransaction], int]:
    base = select(VipTokenTransaction).where(VipTokenTransaction.user_id == user_id)
    total = await session.scalar(select(func.count()).select_from(base.subquery())) or 0
    rows = await session.scalars(
        base.order_by(VipTokenTransaction.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return list(rows), total
