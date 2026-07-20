import uuid

from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.property import Property
from app.models.watchlist import WatchlistItem
from app.services import properties


async def add(session: AsyncSession, user_id: uuid.UUID, property_id: uuid.UUID) -> None:
    await properties.get(session, property_id)  # 404s on an unknown property
    await session.execute(
        pg_insert(WatchlistItem)
        .values(user_id=user_id, property_id=property_id)
        .on_conflict_do_nothing()
    )
    await session.commit()


async def list_for(session: AsyncSession, user_id: uuid.UUID) -> list[Property]:
    rows = await session.scalars(
        select(Property)
        .join(WatchlistItem, WatchlistItem.property_id == Property.id)
        .where(WatchlistItem.user_id == user_id)
        .order_by(WatchlistItem.created_at.desc())
    )
    return list(rows)


async def remove(session: AsyncSession, user_id: uuid.UUID, property_id: uuid.UUID) -> None:
    await session.execute(
        delete(WatchlistItem).where(
            WatchlistItem.user_id == user_id, WatchlistItem.property_id == property_id
        )
    )
    await session.commit()
