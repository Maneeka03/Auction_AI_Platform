import uuid
from datetime import UTC, datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, Numeric, func
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.property import Property


class RoomAccess(StrEnum):
    OPEN = "open"
    INVITE_ONLY = "invite_only"


class AuctionStatus(StrEnum):
    UPCOMING = "upcoming"
    LIVE = "live"
    ENDED = "ended"


class Auction(Base, TimestampMixin):
    __tablename__ = "auctions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), index=True
    )
    starts_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    ends_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    # Set only when an admin closes the room early (by awarding, or by ending with no winner).
    # A NULL ended_at with a past ends_at is still an ended auction - see status below.
    ended_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    opening_bid: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    reserve_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    room_access: Mapped[RoomAccess] = mapped_column(
        pg_enum(RoomAccess, "room_access"), default=RoomAccess.OPEN
    )
    # Quick-bid button amounts. The smallest is also the minimum raise for a custom bid.
    increments: Mapped[list[Decimal]] = mapped_column(ARRAY(Numeric(12, 2)))
    # Share of a bid that must be free in the bidder's wallet to place it.
    # 100 = full payment up front; a lower value takes a token deposit instead.
    token_percent: Mapped[Decimal] = mapped_column(Numeric(5, 2), default=Decimal(100))
    winner_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None
    )

    listing: Mapped[Property] = relationship(lazy="selectin")

    @property
    def status(self) -> AuctionStatus:
        now = datetime.now(UTC)
        if self.ended_at is not None or now >= self.ends_at:
            return AuctionStatus.ENDED
        if now >= self.starts_at:
            return AuctionStatus.LIVE
        return AuctionStatus.UPCOMING

    def minimum_bid(self, current_bid: Decimal | None) -> Decimal:
        """What the next bid has to clear. Quick-bid buttons and custom bids share this floor."""
        if current_bid is None:
            return self.opening_bid
        return current_bid + min(self.increments)


class AuctionInvite(Base):
    __tablename__ = "auction_invites"

    auction_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("auctions.id", ondelete="CASCADE"), primary_key=True
    )
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )


class Bid(Base):
    __tablename__ = "bids"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    auction_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("auctions.id", ondelete="CASCADE"), index=True
    )
    bidder_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
