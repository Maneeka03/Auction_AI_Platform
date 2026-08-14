"""Mandatory shipping insurance for sold auction items.

Source: 13 Jul clarifications follow-up.
  - Section 2 (Payments): "All auction items sold will mandatory need insurance."
  - Side Note B: "Insurance is mandatory for shipping any auction item with an agreed sale. Our
    auction platform will offer various insurance options while providing full transparency by
    presenting (live or dynamic) quotes from all available third-party insurance providers."

This models one policy per escrow (one settled sale = one shipment = one insurance decision).
Live/dynamic third-party quotes are stubbed behind `services/insurance.list_quotes` until the
client names actual insurance partners/integrations - the workflow (quote -> select -> purchase ->
gate release) is real and enforced.
"""

import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Numeric, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum


class InsurancePolicyStatus(StrEnum):
    QUOTE_SELECTED = "quote_selected"  # a quote has been chosen but not yet paid for
    PURCHASED = "purchased"  # premium paid, shipment may proceed
    DECLINED = "declined"  # explicitly waived - only allowed where the client permits an opt-out


class InsurancePolicy(Base, TimestampMixin):
    __tablename__ = "insurance_policies"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    escrow_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("escrows.id", ondelete="CASCADE"), unique=True, index=True
    )
    provider_name: Mapped[str] = mapped_column(String(120))
    quoted_premium: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    coverage_amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    status: Mapped[InsurancePolicyStatus] = mapped_column(
        pg_enum(InsurancePolicyStatus, "insurance_policy_status"),
        default=InsurancePolicyStatus.QUOTE_SELECTED,
    )
    purchased_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    escrow: Mapped["Escrow"] = relationship(lazy="selectin")  # noqa: F821
