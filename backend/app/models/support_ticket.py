import uuid
from enum import StrEnum

from sqlalchemy import ForeignKey, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.ticket_subject import TicketSubject


class TicketStatus(StrEnum):
    OPEN = "open"
    IN_PROGRESS = "in_progress"
    RESOLVED = "resolved"
    CLOSED = "closed"


class SupportTicket(Base, TimestampMixin):
    """A user's own support request. Status exists for future staff handling, but nothing sets it
    besides the default yet - there's no admin queue built for this today, only self-service.

    Exactly one of subject_id or custom_subject is set: a predefined subject if the user picked
    one, or their own typed subject if they picked "Other" on the frontend.
    """

    __tablename__ = "support_tickets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"), index=True)
    subject_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("ticket_subjects.id", ondelete="SET NULL"), default=None
    )
    custom_subject: Mapped[str | None] = mapped_column(String(200), default=None)
    message: Mapped[str] = mapped_column(Text)
    status: Mapped[TicketStatus] = mapped_column(
        pg_enum(TicketStatus, "ticket_status"), default=TicketStatus.OPEN
    )

    subject: Mapped[TicketSubject | None] = relationship(lazy="selectin")