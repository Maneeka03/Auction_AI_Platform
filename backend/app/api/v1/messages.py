import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.messaging import (
    AdminMessageOut,
    AdminThreadOut,
    ChatUserResult,
    MessageOut,
    SendMessageRequest,
    ThreadOut,
)
from app.services import messaging

router = APIRouter(prefix="/messages", tags=["messages"])

AdminReader = Depends(requires(Module.NOTIFICATIONS, Access.FULL))


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: SendMessageRequest, session: DbSession, actor: CurrentUser
) -> MessageOut:
    message = await messaging.send(
        session, actor, payload.recipient_id, payload.body, payload.property_id
    )
    return MessageOut.model_validate(message)


@router.get("", response_model=list[ThreadOut])
async def my_conversations(session: DbSession, actor: CurrentUser) -> list[ThreadOut]:
    rows = await messaging.threads(session, actor.id)
    return [
        ThreadOut(user_id=r[0], full_name=r[1], last_message=r[2], last_at=r[3], unread=r[4])
        for r in rows
    ]


@router.get("/admin/all", response_model=list[AdminThreadOut])
async def admin_all_conversations(
    session: DbSession, _: User = AdminReader
) -> list[AdminThreadOut]:
    return await messaging.admin_all_threads(session)


@router.get("/admin/{user_a_id}/{user_b_id}", response_model=list[AdminMessageOut])
async def admin_read_thread(
    user_a_id: uuid.UUID,
    user_b_id: uuid.UUID,
    session: DbSession,
    _: User = AdminReader,
) -> list[AdminMessageOut]:
    rows = await messaging.admin_thread(session, user_a_id, user_b_id)
    return [
        AdminMessageOut(**MessageOut.model_validate(msg).model_dump(), sender_name=name)
        for msg, name in rows
    ]


@router.get("/chat-search", response_model=list[ChatUserResult])
async def chat_user_search(
    session: DbSession,
    actor: CurrentUser,
    q: str = Query(min_length=1, max_length=120),
) -> list[ChatUserResult]:
    users = await messaging.chat_search(session, q)
    return [ChatUserResult(id=u.id, full_name=u.full_name, email=u.email) for u in users]


@router.get("/{other_user_id}", response_model=list[MessageOut])
async def conversation(
    other_user_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> list[MessageOut]:
    messages = await messaging.thread(session, actor.id, other_user_id)
    return [MessageOut.model_validate(m) for m in messages]
