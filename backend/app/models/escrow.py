import uuid
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.property import Property


class EscrowState(StrEnum):
    """The client's settlement pipeline. Money moves forward a step at a time, seller paid last."""

    FUNDS_LOCKED = "funds_locked"
    ASSET_HELD = "asset_held"
    AUTHENTICATED = "authenticated"
    RELEASED = "released"


class Escrow(Base, TimestampMixin):
    """Holds a completed sale's money until staff walk it to RELEASED, which pays the seller.

    Opened by a Buy Now or an auction award: the buyer is already debited, and the amount sits here
    rather than going straight to the seller - see services/escrow.
    """

    __tablename__ = "escrows"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), index=True
    )
    buyer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None
    )
    seller_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None
    )
    auction_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("auctions.id", ondelete="SET NULL"), default=None
    )
    amount: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    state: Mapped[EscrowState] = mapped_column(
        pg_enum(EscrowState, "escrow_state"), default=EscrowState.FUNDS_LOCKED, index=True
    )

    listing: Mapped[Property] = relationship(lazy="selectin")
