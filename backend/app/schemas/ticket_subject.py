import uuid

from pydantic import BaseModel, Field

from app.models.ticket_subject import TicketSubject


class CreateTicketSubjectRequest(BaseModel):
    name: str = Field(min_length=2, max_length=150)
    sort_order: int = 0
    is_active: bool = True


class UpdateTicketSubjectRequest(BaseModel):
    name: str | None = Field(default=None, min_length=2, max_length=150)
    sort_order: int | None = None
    is_active: bool | None = None


class TicketSubjectOut(BaseModel):
    id: uuid.UUID
    name: str
    is_active: bool
    sort_order: int

    @classmethod
    def of(cls, subject: TicketSubject) -> "TicketSubjectOut":
        return cls(id=subject.id, name=subject.name, is_active=subject.is_active, sort_order=subject.sort_order)


class TicketSubjectPage(BaseModel):
    items: list[TicketSubjectOut]
    total: int