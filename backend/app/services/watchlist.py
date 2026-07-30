import uuid

from fastapi import status
from sqlalchemy import Row, delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.property import Property
from app.models.watchlist import WatchlistItem, WatchlistStatus
from app.services import properties


async def add(session: AsyncSession, user_id: uuid.UUID, property_id: uuid.UUID) -> None:
    await properties.get(session, property_id)  # 404s on an unknown property
    await session.execute(
        pg_insert(WatchlistItem)
        .values(user_id=user_id, property_id=property_id)
        .on_conflict_do_nothing()
    )
    await session.commit()


async def list_for(session: AsyncSession, user_id: uuid.UUID) -> list[Row]:
    """Each saved item paired with its property, newest first."""
    rows = await session.execute(
        select(WatchlistItem, Property)
        .join(Property, Property.id == WatchlistItem.property_id)
        .where(WatchlistItem.user_id == user_id)
        .order_by(WatchlistItem.created_at.desc())
    )
    return list(rows.all())


async def update_status(
    session: AsyncSession, user_id: uuid.UUID, property_id: uuid.UUID, new_status: WatchlistStatus
) -> WatchlistItem:
    item = await session.get(WatchlistItem, (user_id, property_id))
    if item is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND, "not_watchlisted", "This property is not in your watchlist."
        )
    item.status = new_status
    await session.commit()
    return item


async def remove(session: AsyncSession, user_id: uuid.UUID, property_id: uuid.UUID) -> None:
    await session.execute(
        delete(WatchlistItem).where(
            WatchlistItem.user_id == user_id, WatchlistItem.property_id == property_id
        )
    )
    await session.commit()
