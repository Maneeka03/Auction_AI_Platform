import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.messaging import (
    CreateGroupRequest,
    GroupMessageOut,
    GroupOut,
    SendGroupMessageRequest,
)
from app.services import groups

router = APIRouter(prefix="/groups", tags=["groups"])


@router.post("", response_model=GroupOut, status_code=status.HTTP_201_CREATED)
async def create_group(
    payload: CreateGroupRequest, session: DbSession, actor: CurrentUser
) -> GroupOut:
    return await groups.create(session, actor.id, payload)


@router.get("", response_model=list[GroupOut])
async def list_groups(session: DbSession, actor: CurrentUser) -> list[GroupOut]:
    return await groups.list_for_user(session, actor.id)


@router.get("/{group_id}/messages", response_model=list[GroupMessageOut])
async def get_group_messages(
    group_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> list[GroupMessageOut]:
    return await groups.get_messages(session, group_id, actor.id)


@router.post(
    "/{group_id}/messages",
    response_model=GroupMessageOut,
    status_code=status.HTTP_201_CREATED,
)
async def send_group_message(
    group_id: uuid.UUID,
    payload: SendGroupMessageRequest,
    session: DbSession,
    actor: CurrentUser,
) -> GroupMessageOut:
    return await groups.send_message(session, group_id, actor.id, payload.body)
