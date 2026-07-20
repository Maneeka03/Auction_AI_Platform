import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, pg_enum


class Wallet(Base, TimestampMixin):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    # Money the user has paid in and not yet lost to a won auction. Funds locked by live bids are
    # NOT subtracted here - they are derived from the bids table, so a losing bid frees itself the
    # moment its auction settles. See services/wallets.held.
    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0))


class WalletEntryKind(StrEnum):
    DEPOSIT = "deposit"
    WITHDRAWAL = "withdrawal"
    BID_HOLD = "bid_hold"
    REFUND = "refund"
    PURCHASE = "purchase"
    PAYOUT = "payout"  # a seller being paid for a listing that sold


class WalletEntry(Base):
    """An append-only activity log, NOT the source of truth for any number.

    Balance lives on Wallet.balance and locked funds are derived from bids; this table only tells
    the user what happened and when. bid_hold and refund are not balance movements, so these rows
    deliberately do not sum to the balance - never compute one from the other.
    """

    __tablename__ = "wallet_entries"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    kind: Mapped[WalletEntryKind] = mapped_column(pg_enum(WalletEntryKind, "wallet_entry_kind"))
    # Signed the way the user reads it: money in is positive, money out is negative.
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    auction_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("auctions.id", ondelete="SET NULL"), default=None
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
