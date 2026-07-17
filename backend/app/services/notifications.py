import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationKind


def push(
    session: AsyncSession,
    user_id: uuid.UUID,
    kind: NotificationKind,
    message: str,
    auction_id: uuid.UUID | None = None,
    property_id: uuid.UUID | None = None,
) -> None:
    """Queue a notification on the caller's transaction. The caller commits."""
    session.add(
        Notification(
            user_id=user_id,
            kind=kind,
            message=message,
            auction_id=auction_id,
            property_id=property_id,
        )
    )


async def paginate(
    session: AsyncSession, user_id: uuid.UUID, limit: int, unread_only: bool
) -> tuple[list[Notification], int]:
    query = select(Notification).where(Notification.user_id == user_id)
    if unread_only:
        query = query.where(Notification.read_at.is_(None))

    unread = await session.scalar(
        select(func.count())
        .select_from(Notification)
        .where(Notification.user_id == user_id, Notification.read_at.is_(None))
    )
    rows = await session.scalars(query.order_by(Notification.created_at.desc()).limit(limit))
    return list(rows), unread or 0


async def mark_read(session: AsyncSession, user_id: uuid.UUID, ids: list[uuid.UUID] | None) -> None:
    """Mark the given notifications read, or every unread one when ids is omitted."""
    query = update(Notification).where(
        Notification.user_id == user_id, Notification.read_at.is_(None)
    )
    if ids is not None:
        query = query.where(Notification.id.in_(ids))

    await session.execute(query.values(read_at=datetime.now(UTC)))
    await session.commit()
