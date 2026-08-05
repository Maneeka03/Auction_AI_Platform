import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.support_ticket import SupportTicket
from app.schemas.support_ticket import CreateTicketRequest, UpdateTicketRequest


async def get_own(session: AsyncSession, ticket_id: uuid.UUID, user_id: uuid.UUID) -> SupportTicket:
    """Fetch a ticket scoped to its owner — a user can only ever see or touch their own."""
    ticket = await session.get(SupportTicket, ticket_id)
    if ticket is None or ticket.user_id != user_id:
        raise AppError(status.HTTP_404_NOT_FOUND, "ticket_not_found", "Ticket not found.")
    return ticket


async def list_own(session: AsyncSession, user_id: uuid.UUID) -> tuple[list[SupportTicket], int]:
    rows = await session.scalars(
        select(SupportTicket)
        .where(SupportTicket.user_id == user_id)
        .order_by(SupportTicket.created_at.desc())
    )
    items = list(rows.all())
    return items, len(items)


async def create(session: AsyncSession, user_id: uuid.UUID, data: CreateTicketRequest) -> SupportTicket:
    ticket = SupportTicket(
        user_id=user_id,
        subject_id=data.subject_id,
        custom_subject=data.custom_subject,
        message=data.message,
    )
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    return ticket


async def update(
    session: AsyncSession, ticket_id: uuid.UUID, user_id: uuid.UUID, data: UpdateTicketRequest
) -> SupportTicket:
    ticket = await get_own(session, ticket_id, user_id)
    fields = data.model_dump(exclude_unset=True)
    if "subject_id" in fields and fields["subject_id"] is not None:
        fields["custom_subject"] = None
    elif "custom_subject" in fields and fields["custom_subject"]:
        fields["subject_id"] = None
    for field, value in fields.items():
        setattr(ticket, field, value)
    await session.commit()
    await session.refresh(ticket)
    return ticket


async def remove(session: AsyncSession, ticket_id: uuid.UUID, user_id: uuid.UUID) -> None:
    ticket = await get_own(session, ticket_id, user_id)
    await session.delete(ticket)
    await session.commit()