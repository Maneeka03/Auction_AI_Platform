import uuid
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, pg_enum
from app.models.user import User


class AuctionRequestStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class AuctionRequest(Base):
    __tablename__ = "auction_requests"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    seller_id: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), nullable=False
    )
    property_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("properties.id", ondelete="CASCADE"), nullable=True
    )
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text, nullable=True)
    # The date/time the seller wants to go live.
    requested_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), nullable=False)
    status: Mapped[AuctionRequestStatus] = mapped_column(
        pg_enum(AuctionRequestStatus, name="auction_request_status"),
        nullable=False,
        default=AuctionRequestStatus.PENDING,
    )
    # Optional auction detail fields — filled in by seller so admin can auto-create the auction on approval.
    opening_bid: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    reserve_price: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), nullable=True)
    ends_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    increments: Mapped[list[Decimal] | None] = mapped_column(ARRAY(Numeric(12, 2)), nullable=True)
    # Set to the created Auction's id after approval auto-creates it.
    auction_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("auctions.id", ondelete="SET NULL"), nullable=True
    )

    admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)
    reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id", ondelete="SET NULL"), nullable=True
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now(), nullable=False
    )

    seller: Mapped[User] = relationship("User", foreign_keys=[seller_id], lazy="selectin")
    reviewer: Mapped[User | None] = relationship("User", foreign_keys=[reviewed_by], lazy="selectin")
