import uuid

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.lead import Lead, LeadStatus
from app.models.user import User
from app.schemas.lead import CreateLeadRequest, UpdateLeadRequest


async def create(session: AsyncSession, actor: User, data: CreateLeadRequest) -> Lead:
    lead = Lead(**data.model_dump(), owner_id=actor.id)
    session.add(lead)
    await session.commit()
    return lead


async def get(session: AsyncSession, lead_id: uuid.UUID) -> Lead:
    lead = await session.get(Lead, lead_id)
    if lead is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "lead_not_found", "Lead not found.")
    return lead


async def paginate(
    session: AsyncSession, page: int, size: int, lead_status: LeadStatus | None
) -> tuple[list[Lead], int]:
    query = select(Lead)
    if lead_status:
        query = query.where(Lead.status == lead_status)

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(Lead.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


async def update(session: AsyncSession, lead_id: uuid.UUID, data: UpdateLeadRequest) -> Lead:
    lead = await get(session, lead_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(lead, field, value)
    await session.commit()
    return lead


async def delete(session: AsyncSession, lead_id: uuid.UUID) -> None:
    lead = await get(session, lead_id)
    await session.delete(lead)
    await session.commit()
