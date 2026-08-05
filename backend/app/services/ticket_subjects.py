import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.ticket_subject import TicketSubject
from app.schemas.ticket_subject import CreateTicketSubjectRequest, UpdateTicketSubjectRequest


async def get(session: AsyncSession, subject_id: uuid.UUID) -> TicketSubject:
    subject = await session.get(TicketSubject, subject_id)
    if subject is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "subject_not_found", "Subject not found.")
    return subject


async def list_all(session: AsyncSession, active_only: bool) -> tuple[list[TicketSubject], int]:
    query = select(TicketSubject).order_by(TicketSubject.sort_order.asc(), TicketSubject.name.asc())
    if active_only:
        query = query.where(TicketSubject.is_active.is_(True))
    rows = await session.scalars(query)
    items = list(rows.all())
    return items, len(items)


async def create(session: AsyncSession, data: CreateTicketSubjectRequest) -> TicketSubject:
    subject = TicketSubject(**data.model_dump())
    session.add(subject)
    await session.commit()
    await session.refresh(subject)
    return subject


async def update(session: AsyncSession, subject_id: uuid.UUID, data: UpdateTicketSubjectRequest) -> TicketSubject:
    subject = await get(session, subject_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(subject, field, value)
    await session.commit()
    await session.refresh(subject)
    return subject


async def remove(session: AsyncSession, subject_id: uuid.UUID) -> None:
    subject = await get(session, subject_id)
    await session.delete(subject)
    await session.commit()