import uuid
from datetime import datetime

from pydantic import BaseModel, Field, model_validator

from app.models.support_ticket import SupportTicket, TicketStatus
from app.schemas.ticket_subject import TicketSubjectOut


class CreateTicketRequest(BaseModel):
    subject_id: uuid.UUID | None = None
    custom_subject: str | None = Field(default=None, max_length=200)
    message: str = Field(min_length=1)

    @model_validator(mode="after")
    def _one_subject_source(self) -> "CreateTicketRequest":
        if not self.subject_id and not (self.custom_subject and self.custom_subject.strip()):
            raise ValueError("Choose a subject, or select Other and describe it.")
        if self.subject_id and self.custom_subject:
            raise ValueError("Provide either a predefined subject or a custom one, not both.")
        return self


class UpdateTicketRequest(BaseModel):
    subject_id: uuid.UUID | None = None
    custom_subject: str | None = Field(default=None, max_length=200)
    message: str | None = Field(default=None, min_length=1)


class TicketOut(BaseModel):
    id: uuid.UUID
    subject: TicketSubjectOut | None
    custom_subject: str | None
    message: str
    status: TicketStatus
    created_at: datetime
    updated_at: datetime

    @classmethod
    def of(cls, ticket: SupportTicket) -> "TicketOut":
        return cls(
            id=ticket.id,
            subject=TicketSubjectOut.of(ticket.subject) if ticket.subject else None,
            custom_subject=ticket.custom_subject,
            message=ticket.message,
            status=ticket.status,
            created_at=ticket.created_at,
            updated_at=ticket.updated_at,
        )


class TicketPage(BaseModel):
    items: list[TicketOut]
    total: int