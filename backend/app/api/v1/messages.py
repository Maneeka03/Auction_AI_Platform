import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.messaging import MessageOut, SendMessageRequest, ThreadOut
from app.services import messaging

router = APIRouter(prefix="/messages", tags=["messages"])


@router.post("", response_model=MessageOut, status_code=status.HTTP_201_CREATED)
async def send_message(
    payload: SendMessageRequest, session: DbSession, actor: CurrentUser
) -> MessageOut:
    message = await messaging.send(
        session, actor.id, payload.recipient_id, payload.body, payload.property_id
    )
    return MessageOut.model_validate(message)


@router.get("", response_model=list[ThreadOut])
async def my_conversations(session: DbSession, actor: CurrentUser) -> list[ThreadOut]:
    rows = await messaging.threads(session, actor.id)
    return [
        ThreadOut(user_id=r[0], full_name=r[1], last_message=r[2], last_at=r[3], unread=r[4])
        for r in rows
    ]


@router.get("/{other_user_id}", response_model=list[MessageOut])
async def conversation(
    other_user_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> list[MessageOut]:
    messages = await messaging.thread(session, actor.id, other_user_id)
    return [MessageOut.model_validate(m) for m in messages]
