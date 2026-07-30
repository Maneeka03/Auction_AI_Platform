import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.saved_search import SavedSearch
from app.schemas.saved_search import SaveSearchRequest


async def create(session: AsyncSession, user_id: uuid.UUID, data: SaveSearchRequest) -> SavedSearch:
    search = SavedSearch(user_id=user_id, name=data.name, filters=data.filters)
    session.add(search)
    await session.commit()
    await session.refresh(search)
    return search


async def list_for(session: AsyncSession, user_id: uuid.UUID) -> list[SavedSearch]:
    rows = await session.scalars(
        select(SavedSearch)
        .where(SavedSearch.user_id == user_id)
        .order_by(SavedSearch.created_at.desc())
    )
    return list(rows)


async def delete(session: AsyncSession, user_id: uuid.UUID, search_id: uuid.UUID) -> None:
    search = await session.get(SavedSearch, search_id)
    if search is None or search.user_id != user_id:
        raise AppError(status.HTTP_404_NOT_FOUND, "search_not_found", "Saved search not found.")
    await session.delete(search)
    await session.commit()
