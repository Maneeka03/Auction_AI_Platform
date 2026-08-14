import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.insurance import InsurancePolicy, InsurancePolicyStatus
from app.services.insurance import InsuranceQuote


class InsuranceQuoteOut(BaseModel):
    provider_name: str
    coverage_amount: Decimal
    premium: Decimal

    @classmethod
    def of(cls, quote: InsuranceQuote) -> "InsuranceQuoteOut":
        return cls(
            provider_name=quote.provider_name,
            coverage_amount=quote.coverage_amount,
            premium=quote.premium,
        )


class SelectQuoteRequest(BaseModel):
    provider_name: str


class InsurancePolicyOut(BaseModel):
    id: uuid.UUID
    escrow_id: uuid.UUID
    provider_name: str
    quoted_premium: Decimal
    coverage_amount: Decimal
    status: InsurancePolicyStatus
    purchased_at: datetime | None

    @classmethod
    def of(cls, policy: InsurancePolicy) -> "InsurancePolicyOut":
        return cls(
            id=policy.id,
            escrow_id=policy.escrow_id,
            provider_name=policy.provider_name,
            quoted_premium=policy.quoted_premium,
            coverage_amount=policy.coverage_amount,
            status=policy.status,
            purchased_at=policy.purchased_at,
        )
