import uuid
from datetime import datetime

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class PushSubscription(Base):
    """One browser/device a user has allowed web push on. A user may have several."""

    __tablename__ = "push_subscriptions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    # endpoint: Mapped[str] = mapped_column(String(500), unique=True)
    # p256dh: Mapped[str] = mapped_column(String(200))
    # auth: Mapped[str] = mapped_column(String(100))
    endpoint: Mapped[str] = mapped_column(String(500), unique=True)
    origin: Mapped[str] = mapped_column(String(500))
    p256dh: Mapped[str] = mapped_column(String(200))
    auth: Mapped[str] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
