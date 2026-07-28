import asyncio
import uuid
from datetime import UTC, datetime

from sqlalchemy import func, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.notification import Notification, NotificationKind
from app.services import push as push_service

# Notification kinds that also fire a browser (device) push. Add a kind here to give any module
# push notifications - nothing else has to change. Titles fall back to "Provenix".
PUSH_KINDS: list[NotificationKind] = [
    NotificationKind.OUTBID,
    NotificationKind.AUCTION_WON,
    NotificationKind.AUCTION_LOST,
    NotificationKind.NEW_MESSAGE,
]

PUSH_TITLES: dict[NotificationKind, str] = {
    NotificationKind.OUTBID: "Auction update",
    NotificationKind.AUCTION_WON: "Auction won",
    NotificationKind.AUCTION_LOST: "Auction ended",
    NotificationKind.NEW_MESSAGE: "New message",
}

_background: set[asyncio.Task] = set()


def push(
    session: AsyncSession,
    user_id: uuid.UUID,
    kind: NotificationKind,
    message: str,
    auction_id: uuid.UUID | None = None,
    property_id: uuid.UUID | None = None,
) -> None:
    """Queue an in-app notification on the caller's transaction; the caller commits.

    Kinds listed in PUSH_KINDS also fire a browser push in the background, best-effort.
    """
    session.add(
        Notification(
            user_id=user_id,
            kind=kind,
            message=message,
            auction_id=auction_id,
            property_id=property_id,
        )
    )
    if kind in PUSH_KINDS:
        _fire(push_service.dispatch(user_id, PUSH_TITLES.get(kind, "Provenix"), message))


def _fire(coro) -> None:
    """Run a best-effort coroutine detached from the request, keeping a reference so it survives."""
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        coro.close()
        return
    task = loop.create_task(coro)
    _background.add(task)
    task.add_done_callback(_background.discard)


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
