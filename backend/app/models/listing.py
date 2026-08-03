import uuid
from datetime import UTC, datetime

import sqlalchemy as sa
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base


class ListingStatus(str):
    ACTIVE = "active"
    EXPIRED = "expired"
    SOLD = "sold"


class Listing(Base):
    """
    Created automatically when a Property reaches 2 approval votes (status → published).
    Represents the official auction-eligible listing record.
    """

    __tablename__ = "listings"

    id: Mapped[uuid.UUID] = mapped_column(sa.UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    property_id: Mapped[uuid.UUID] = mapped_column(
        sa.UUID(as_uuid=True),
        sa.ForeignKey("properties.id", ondelete="CASCADE"),
        nullable=False,
        unique=True,
    )
    status: Mapped[str] = mapped_column(sa.String(20), nullable=False, default="active")
    reserve_price: Mapped[float | None] = mapped_column(sa.Numeric(12, 2), nullable=True)
    listed_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )
    expires_at: Mapped[datetime | None] = mapped_column(sa.DateTime(timezone=True), nullable=True)
    created_at: Mapped[datetime] = mapped_column(
        sa.DateTime(timezone=True), nullable=False, default=lambda: datetime.now(UTC)
    )

    property: Mapped["Property"] = relationship("Property", back_populates="listing", lazy="selectin")  # noqa: F821
