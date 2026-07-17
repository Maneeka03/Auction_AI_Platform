from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
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
