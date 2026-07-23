import uuid

from sqlalchemy import Row, delete, func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import UNPROCESSABLE, AppError
from app.models.sidebar import SidebarItem, SidebarPreference
from app.schemas.sidebar import SidebarEntryIn


async def catalogue(session: AsyncSession) -> list[SidebarItem]:
    rows = await session.scalars(select(SidebarItem).order_by(SidebarItem.default_order))
    return list(rows)


async def config(session: AsyncSession, user_id: uuid.UUID) -> list[Row]:
    """Every catalogue item with this admin's override, or its default when they haven't set one.

    Configured items keep their saved order; anything the admin never touched follows, by default
    order, so a menu item added to the catalogue later shows up until they arrange it.
    """
    prefs = select(SidebarPreference).where(SidebarPreference.user_id == user_id).subquery()
    rows = await session.execute(
        select(
            SidebarItem.id,
            SidebarItem.key,
            SidebarItem.label,
            func.coalesce(prefs.c.visible, True),
            func.coalesce(prefs.c.position, SidebarItem.default_order),
        )
        .outerjoin(prefs, prefs.c.item_id == SidebarItem.id)
        .order_by(
            prefs.c.position.is_(None), func.coalesce(prefs.c.position, SidebarItem.default_order)
        )
    )
    return list(rows.all())


async def save(session: AsyncSession, user_id: uuid.UUID, items: list[SidebarEntryIn]) -> list[Row]:
    ids = [entry.item_id for entry in items]
    if len(ids) != len(set(ids)):
        raise AppError(UNPROCESSABLE, "duplicate_items", "Each sidebar item may appear only once.")

    known = set(await session.scalars(select(SidebarItem.id).where(SidebarItem.id.in_(ids))))
    if len(known) != len(ids):
        raise AppError(UNPROCESSABLE, "unknown_item", "One or more sidebar items do not exist.")

    await session.execute(delete(SidebarPreference).where(SidebarPreference.user_id == user_id))
    for position, entry in enumerate(items):
        session.add(
            SidebarPreference(
                user_id=user_id, item_id=entry.item_id, visible=entry.visible, position=position
            )
        )
    await session.commit()
    return await config(session, user_id)
