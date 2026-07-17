import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import ARRAY, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.user import User


class KycStatus(StrEnum):
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"


class KycSubmission(Base, TimestampMixin):
    """A buyer or seller's identity pack awaiting staff review.

    Deliberately separate from the users table: auth only ever tracks whether the EMAIL is verified,
    and bidding gates on this instead. One live submission per user - a rejected applicant resubmits
    onto the same row.
    """

    __tablename__ = "kyc_submissions"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    status: Mapped[KycStatus] = mapped_column(
        pg_enum(KycStatus, "kyc_status"), default=KycStatus.PENDING, index=True
    )
    legal_name: Mapped[str] = mapped_column(String(200))
    # Object keys in the provenance vault, not public URLs. See services/uploads.
    document_keys: Mapped[list[str]] = mapped_column(ARRAY(String(500)))
    reviewer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None
    )
    reviewed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    notes: Mapped[str | None] = mapped_column(Text, default=None)

    user: Mapped[User] = relationship(lazy="selectin", foreign_keys=user_id)
