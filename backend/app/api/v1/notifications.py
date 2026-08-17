import asyncio
import uuid

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status

from app.api.deps import DbSession, requires, socket_user
from app.core import events
from app.db.session import SessionFactory
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.notification import MarkReadRequest, NotificationOut, NotificationPage
from app.services import notifications

router = APIRouter(prefix="/notifications", tags=["notifications"])

# Every role holds full notifications access, so this is simply "any signed-in user, their own".
Recipient = Depends(requires(Module.NOTIFICATIONS, Access.FULL))


@router.get("", response_model=NotificationPage)
async def list_notifications(
    session: DbSession,
    limit: int = Query(20, ge=1, le=100),
    unread_only: bool = False,
    actor: User = Recipient,
) -> NotificationPage:
    items, unread = await notifications.paginate(session, actor.id, limit, unread_only)
    return NotificationPage(
        items=[NotificationOut.model_validate(item) for item in items], unread=unread
    )


@router.post("/read", status_code=status.HTTP_204_NO_CONTENT)
async def mark_notifications_read(
    payload: MarkReadRequest, session: DbSession, actor: User = Recipient
) -> None:
    await notifications.mark_read(session, actor.id, payload.ids)


@router.delete("/{notification_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_notification(
    notification_id: uuid.UUID, session: DbSession, actor: User = Recipient
) -> None:
    deleted = await notifications.delete_one(session, actor.id, notification_id)
    if not deleted:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found")


async def _relay(websocket: WebSocket, channel: str) -> None:
    async for event in events.subscribe(channel):
        await websocket.send_json(event)


@router.websocket("/ws")
async def notifications_ws(websocket: WebSocket, token: str) -> None:
    await websocket.accept()
    async with SessionFactory() as session:
        user = await socket_user(session, token)
        if user is None:
            await websocket.close(code=4401)
            return

        channel = events.notification_channel(user.id)

    relay = asyncio.create_task(_relay(websocket, channel))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        relay.cancel()
