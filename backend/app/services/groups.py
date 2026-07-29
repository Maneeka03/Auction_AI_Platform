import uuid

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.messaging import GroupChat, GroupChatMember, GroupMessage
from app.models.user import User, UserStatus
from app.schemas.messaging import (
    CreateGroupRequest,
    GroupMessageOut,
    GroupOut,
)
from app.services import users as user_svc


async def create(
    session: AsyncSession, actor_id: uuid.UUID, payload: CreateGroupRequest
) -> GroupOut:
    group = GroupChat(name=payload.name, created_by=actor_id)
    session.add(group)
    await session.flush()

    all_member_ids = list({actor_id, *payload.member_ids})
    for uid in all_member_ids:
        await user_svc.get(session, uid)
        session.add(GroupChatMember(group_id=group.id, user_id=uid))

    await session.commit()
    await session.refresh(group)
    return GroupOut(
        id=group.id,
        name=group.name,
        created_by=group.created_by,
        created_at=group.created_at,
        member_count=len(all_member_ids),
        last_message=None,
        last_at=None,
    )


async def list_for_user(session: AsyncSession, user_id: uuid.UUID) -> list[GroupOut]:
    membership = (
        select(GroupChatMember.group_id)
        .where(GroupChatMember.user_id == user_id)
        .subquery()
    )
    latest_msg = (
        select(
            GroupMessage.group_id,
            GroupMessage.body.label("last_body"),
            GroupMessage.created_at.label("last_at"),
        )
        .order_by(GroupMessage.group_id, GroupMessage.created_at.desc())
        .distinct(GroupMessage.group_id)
        .subquery()
    )
    member_count = (
        select(GroupChatMember.group_id, func.count().label("cnt"))
        .group_by(GroupChatMember.group_id)
        .subquery()
    )
    rows = await session.execute(
        select(
            GroupChat,
            latest_msg.c.last_body,
            latest_msg.c.last_at,
            member_count.c.cnt,
        )
        .where(GroupChat.id.in_(select(membership.c.group_id)))
        .outerjoin(latest_msg, latest_msg.c.group_id == GroupChat.id)
        .outerjoin(member_count, member_count.c.group_id == GroupChat.id)
        .order_by(latest_msg.c.last_at.desc().nullslast())
    )
    result = []
    for group, last_body, last_at, cnt in rows:
        result.append(
            GroupOut(
                id=group.id,
                name=group.name,
                created_by=group.created_by,
                created_at=group.created_at,
                member_count=cnt or 0,
                last_message=last_body,
                last_at=last_at,
            )
        )
    return result


async def _assert_member(session: AsyncSession, group_id: uuid.UUID, user_id: uuid.UUID) -> None:
    member = await session.get(GroupChatMember, (group_id, user_id))
    if member is None:
        raise AppError(status.HTTP_403_FORBIDDEN, "not_a_member", "You are not a member of this group.")


async def get_messages(
    session: AsyncSession, group_id: uuid.UUID, user_id: uuid.UUID
) -> list[GroupMessageOut]:
    await _assert_member(session, group_id, user_id)
    rows = await session.execute(
        select(GroupMessage, User.full_name)
        .join(User, User.id == GroupMessage.sender_id)
        .where(GroupMessage.group_id == group_id)
        .order_by(GroupMessage.created_at)
    )
    return [
        GroupMessageOut(
            id=msg.id,
            group_id=msg.group_id,
            sender_id=msg.sender_id,
            sender_name=name,
            body=msg.body,
            created_at=msg.created_at,
        )
        for msg, name in rows
    ]


async def send_message(
    session: AsyncSession, group_id: uuid.UUID, sender_id: uuid.UUID, body: str
) -> GroupMessageOut:
    await _assert_member(session, group_id, sender_id)
    sender = await session.get(User, sender_id)
    if sender is None or sender.status is not UserStatus.ACTIVE:
        raise AppError(status.HTTP_403_FORBIDDEN, "forbidden", "User not active.")

    msg = GroupMessage(group_id=group_id, sender_id=sender_id, body=body)
    session.add(msg)
    await session.commit()
    return GroupMessageOut(
        id=msg.id,
        group_id=msg.group_id,
        sender_id=msg.sender_id,
        sender_name=sender.full_name,
        body=msg.body,
        created_at=msg.created_at,
    )
