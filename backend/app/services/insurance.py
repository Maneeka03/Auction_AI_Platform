# import uuid
# from dataclasses import dataclass
# from datetime import UTC, datetime
# from decimal import Decimal

# from fastapi import status
# from sqlalchemy import select
# from sqlalchemy.ext.asyncio import AsyncSession

# from app.core.errors import AppError
# from app.models.escrow import Escrow
# from app.models.insurance import InsurancePolicy, InsurancePolicyStatus

# # Live/dynamic quotes, per Side Note B: "presenting (live or dynamic) quotes from all available
# # third-party insurance providers." No provider integrations are named yet, so this returns a
# # deterministic, clearly-labelled stub set (a flat rate per provider) instead of a hardcoded
# # single insurer - the workflow around it (compare -> select -> purchase -> gate release) is real.
# _PROVIDER_RATES: dict[str, Decimal] = {
#     "Provenix Partner Cover": Decimal("0.015"),
#     "Global Fine Art Assurance": Decimal("0.018"),
#     "Heritage Shipping Insurance": Decimal("0.012"),
# }
# _MINIMUM_PREMIUM = Decimal("15.00")


# @dataclass(frozen=True)
# class InsuranceQuote:
#     provider_name: str
#     coverage_amount: Decimal
#     premium: Decimal


# def list_quotes(sale_amount: Decimal) -> list[InsuranceQuote]:
#     quotes = [
#         InsuranceQuote(
#             provider_name=name,
#             coverage_amount=sale_amount,
#             premium=max(_MINIMUM_PREMIUM, (sale_amount * rate).quantize(Decimal("0.01"))),
#         )
#         for name, rate in _PROVIDER_RATES.items()
#     ]
#     return sorted(quotes, key=lambda q: q.premium)


# async def _get_escrow(session: AsyncSession, escrow_id: uuid.UUID) -> Escrow:
#     escrow = await session.get(Escrow, escrow_id)
#     if escrow is None:
#         raise AppError(status.HTTP_404_NOT_FOUND, "escrow_not_found", "Escrow not found.")
#     return escrow


# async def get_policy(session: AsyncSession, escrow_id: uuid.UUID) -> InsurancePolicy | None:
#     return await session.scalar(
#         select(InsurancePolicy).where(InsurancePolicy.escrow_id == escrow_id)
#     )


# async def select_quote(
#     session: AsyncSession, escrow_id: uuid.UUID, provider_name: str, sale_amount: Decimal
# ) -> InsurancePolicy:
#     """Records the buyer/seller's chosen quote as pending purchase. Re-selecting before purchase
#     just updates the existing row."""
#     escrow = await _get_escrow(session, escrow_id)  # 404s if the escrow doesn't exist
#     quote = next((q for q in list_quotes(sale_amount) if q.provider_name == provider_name), None)
#     if quote is None:
#         raise AppError(
#             status.HTTP_400_BAD_REQUEST, "unknown_provider", "That quote is no longer available."
#         )

#     policy = await get_policy(session, escrow.id)
#     if policy is None:
#         policy = InsurancePolicy(escrow_id=escrow.id)
#         session.add(policy)
#     if policy.status == InsurancePolicyStatus.PURCHASED:
#         raise AppError(
#             status.HTTP_409_CONFLICT,
#             "already_purchased",
#             "This shipment already has a purchased insurance policy.",
#         )

#     policy.provider_name = quote.provider_name
#     policy.coverage_amount = quote.coverage_amount
#     policy.quoted_premium = quote.premium
#     policy.status = InsurancePolicyStatus.QUOTE_SELECTED
#     await session.commit()
#     await session.refresh(policy)
#     return policy


# async def purchase_policy(session: AsyncSession, escrow_id: uuid.UUID) -> InsurancePolicy:
#     """Marks the selected quote as paid. Premium collection is stubbed - same caveat as the
#     other payment-adjacent stubs in this build (crypto/escrow design is still pending legal
#     sign-off per section 2 of the clarifications)."""
#     policy = await get_policy(session, escrow_id)
#     if policy is None:
#         raise AppError(
#             status.HTTP_400_BAD_REQUEST,
#             "no_quote_selected",
#             "Select an insurance quote before purchasing a policy.",
#         )
#     policy.status = InsurancePolicyStatus.PURCHASED
#     policy.purchased_at = datetime.now(UTC)
#     await session.commit()
#     await session.refresh(policy)
#     return policy


# async def require_purchased_before_release(session: AsyncSession, escrow_id: uuid.UUID) -> None:
#     """Enforcement point for "All auction items sold will mandatory need insurance" (section 2)
#     and Side Note B. Call this before an escrow is allowed to move to RELEASED."""
#     policy = await get_policy(session, escrow_id)
#     if policy is None or policy.status != InsurancePolicyStatus.PURCHASED:
#         raise AppError(
#             status.HTTP_409_CONFLICT,
#             "insurance_required",
#             "Shipping insurance must be purchased for this item before it can be released.",
#         )

import uuid
from dataclasses import dataclass
from datetime import UTC, datetime
from decimal import Decimal

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.escrow import Escrow
from app.models.insurance import InsurancePolicy, InsurancePolicyStatus
from app.models.wallet import WalletEntryKind
from app.services import wallets

# Live/dynamic quotes, per Side Note B: "presenting (live or dynamic) quotes from all available
# third-party insurance providers." No provider integrations are named yet, so this returns a
# deterministic, clearly-labelled stub set (a flat rate per provider) instead of a hardcoded
# single insurer - the workflow around it (compare -> select -> purchase -> gate release) is real.
_PROVIDER_RATES: dict[str, Decimal] = {
    "Provenix Partner Cover": Decimal("0.015"),
    "Global Fine Art Assurance": Decimal("0.018"),
    "Heritage Shipping Insurance": Decimal("0.012"),
}
_MINIMUM_PREMIUM = Decimal("15.00")


@dataclass(frozen=True)
class InsuranceQuote:
    provider_name: str
    coverage_amount: Decimal
    premium: Decimal


def list_quotes(sale_amount: Decimal) -> list[InsuranceQuote]:
    quotes = [
        InsuranceQuote(
            provider_name=name,
            coverage_amount=sale_amount,
            premium=max(_MINIMUM_PREMIUM, (sale_amount * rate).quantize(Decimal("0.01"))),
        )
        for name, rate in _PROVIDER_RATES.items()
    ]
    return sorted(quotes, key=lambda q: q.premium)


async def _get_escrow(session: AsyncSession, escrow_id: uuid.UUID) -> Escrow:
    escrow = await session.get(Escrow, escrow_id)
    if escrow is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "escrow_not_found", "Escrow not found.")
    return escrow


async def get_policy(session: AsyncSession, escrow_id: uuid.UUID) -> InsurancePolicy | None:
    return await session.scalar(
        select(InsurancePolicy).where(InsurancePolicy.escrow_id == escrow_id)
    )


async def select_quote(
    session: AsyncSession, escrow_id: uuid.UUID, provider_name: str, sale_amount: Decimal
) -> InsurancePolicy:
    """Records the buyer/seller's chosen quote as pending purchase. Re-selecting before purchase
    just updates the existing row."""
    escrow = await _get_escrow(session, escrow_id)  # 404s if the escrow doesn't exist
    quote = next((q for q in list_quotes(sale_amount) if q.provider_name == provider_name), None)
    if quote is None:
        raise AppError(
            status.HTTP_400_BAD_REQUEST, "unknown_provider", "That quote is no longer available."
        )

    policy = await get_policy(session, escrow.id)
    if policy is None:
        policy = InsurancePolicy(escrow_id=escrow.id)
        session.add(policy)
    if policy.status == InsurancePolicyStatus.PURCHASED:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "already_purchased",
            "This shipment already has a purchased insurance policy.",
        )

    policy.provider_name = quote.provider_name
    policy.coverage_amount = quote.coverage_amount
    policy.quoted_premium = quote.premium
    policy.status = InsurancePolicyStatus.QUOTE_SELECTED
    await session.commit()
    await session.refresh(policy)
    return policy


async def purchase_policy(session: AsyncSession, escrow_id: uuid.UUID) -> InsurancePolicy:
    """Marks the selected quote as paid and actually moves the money: the buyer's wallet is
    debited the quoted premium, and the platform's account (the earliest-created Senior Admin -
    see wallets.platform_account_id) is credited the same amount. Shipping insurance is sold by
    the platform itself, not the seller, so this is separate from the seller's escrow payout."""
    policy = await get_policy(session, escrow_id)
    if policy is None:
        raise AppError(
            status.HTTP_400_BAD_REQUEST,
            "no_quote_selected",
            "Select an insurance quote before purchasing a policy.",
        )
    if policy.status == InsurancePolicyStatus.PURCHASED:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "already_purchased",
            "This shipment already has a purchased insurance policy.",
        )

    escrow = await _get_escrow(session, escrow_id)
    if escrow.buyer_id is None:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "no_buyer",
            "This escrow has no buyer on file to charge for insurance.",
        )

    wallet = await wallets.locked(session, escrow.buyer_id)
    if policy.quoted_premium > await wallets.spendable(session, wallet):
        raise AppError(
            status.HTTP_409_CONFLICT,
            "insufficient_funds",
            "Your wallet does not cover this insurance premium. Add funds and try again.",
        )

    wallet.balance -= policy.quoted_premium
    wallets.log(session, escrow.buyer_id, WalletEntryKind.INSURANCE_PREMIUM, -policy.quoted_premium)

    admin_id = await wallets.platform_account_id(session)
    if admin_id is not None:
        await wallets.credit(
            session, admin_id, policy.quoted_premium, WalletEntryKind.INSURANCE_PREMIUM
        )

    policy.status = InsurancePolicyStatus.PURCHASED
    policy.purchased_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(policy)
    return policy


async def require_purchased_before_release(session: AsyncSession, escrow_id: uuid.UUID) -> None:
    """Enforcement point for "All auction items sold will mandatory need insurance" (section 2)
    and Side Note B. Call this before an escrow is allowed to move to RELEASED."""
    policy = await get_policy(session, escrow_id)
    if policy is None or policy.status != InsurancePolicyStatus.PURCHASED:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "insurance_required",
            "Shipping insurance must be purchased for this item before it can be released.",
        )