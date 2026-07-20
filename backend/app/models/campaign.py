import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin, pg_enum


class CampaignChannel(StrEnum):
    EMAIL = "email"
    SMS = "sms"
    PUSH = "push"


class CampaignStatus(StrEnum):
    DRAFT = "draft"
    SCHEDULED = "scheduled"
    SENT = "sent"
    ARCHIVED = "archived"


class Campaign(Base, TimestampMixin):
    """A marketing message staff compose and send to an audience of users."""

    __tablename__ = "campaigns"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(160))
    channel: Mapped[CampaignChannel] = mapped_column(pg_enum(CampaignChannel, "campaign_channel"))
    status: Mapped[CampaignStatus] = mapped_column(
        pg_enum(CampaignStatus, "campaign_status"), default=CampaignStatus.DRAFT, index=True
    )
    subject: Mapped[str | None] = mapped_column(String(200), default=None)
    body: Mapped[str] = mapped_column(Text)
    # Free-form audience tag the client filters on, e.g. "buyers", "sellers", "all".
    audience: Mapped[str | None] = mapped_column(String(60), default=None)
    scheduled_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    sent_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
