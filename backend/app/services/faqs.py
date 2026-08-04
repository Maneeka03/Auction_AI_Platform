import uuid

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.faq import FAQ
from app.schemas.faq import CreateFAQRequest, UpdateFAQRequest


async def get(session: AsyncSession, faq_id: uuid.UUID) -> FAQ:
    faq = await session.get(FAQ, faq_id)
    if faq is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "faq_not_found", "FAQ not found.")
    return faq


async def paginate(
    session: AsyncSession, page: int, size: int, published_only: bool
) -> tuple[list[FAQ], int]:
    query = select(FAQ)
    count_query = select(func.count()).select_from(FAQ)
    if published_only:
        query = query.where(FAQ.is_published.is_(True))
        count_query = count_query.where(FAQ.is_published.is_(True))

    total = await session.scalar(count_query) or 0
    rows = await session.scalars(
        query.order_by(FAQ.sort_order.asc(), FAQ.created_at.asc()).offset((page - 1) * size).limit(size)
    )
    return list(rows.all()), total


async def create(session: AsyncSession, data: CreateFAQRequest) -> FAQ:
    faq = FAQ(**data.model_dump())
    session.add(faq)
    await session.commit()
    await session.refresh(faq)
    return faq


async def update(session: AsyncSession, faq_id: uuid.UUID, data: UpdateFAQRequest) -> FAQ:
    faq = await get(session, faq_id)
    for field, value in data.model_dump(exclude_none=True).items():
        setattr(faq, field, value)
    await session.commit()
    await session.refresh(faq)
    return faq


async def remove(session: AsyncSession, faq_id: uuid.UUID) -> None:
    faq = await get(session, faq_id)
    await session.delete(faq)
    await session.commit()