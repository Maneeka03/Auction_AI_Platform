import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, func
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, pg_enum


class WatchlistStatus(StrEnum):
    WATCHING = "watching"
    CART = "cart"
    CLOSED = "closed"
    DELIVERED = "delivered"


class WatchlistItem(Base):
    """A property a user has saved to come back to. The composite key saves each one once."""

    __tablename__ = "watchlist_items"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True
    )
    status: Mapped[WatchlistStatus] = mapped_column(
        pg_enum(WatchlistStatus, "watchlist_status"), default=WatchlistStatus.WATCHING
    )
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
