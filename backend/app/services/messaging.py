import uuid
from datetime import UTC, datetime

from sqlalchemy import Row, and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.messaging import Message
from app.models.user import User
from app.services import users


async def send(
    session: AsyncSession,
    sender_id: uuid.UUID,
    recipient_id: uuid.UUID,
    body: str,
    property_id: uuid.UUID | None,
) -> Message:
    await users.get(session, recipient_id)  # 404s on an unknown recipient
    message = Message(
        sender_id=sender_id, recipient_id=recipient_id, body=body, property_id=property_id
    )
    session.add(message)
    await session.commit()
    return message


async def thread(session: AsyncSession, user_id: uuid.UUID, other_id: uuid.UUID) -> list[Message]:
    """Every message between the two users, oldest first, marking the other's messages read."""
    await users.get(session, other_id)
    await session.execute(
        update(Message)
        .where(
            Message.sender_id == other_id,
            Message.recipient_id == user_id,
            Message.read_at.is_(None),
        )
        .values(read_at=datetime.now(UTC))
    )
    await session.commit()
    rows = await session.scalars(
        select(Message)
        .where(
            or_(
                and_(Message.sender_id == user_id, Message.recipient_id == other_id),
                and_(Message.sender_id == other_id, Message.recipient_id == user_id),
            )
        )
        .order_by(Message.created_at)
    )
    return list(rows)


async def threads(session: AsyncSession, user_id: uuid.UUID) -> list[Row]:
    """One row per conversation partner: their name, the latest line, and unread count."""
    other = case((Message.sender_id == user_id, Message.recipient_id), else_=Message.sender_id)
    latest = (
        select(other.label("other"), Message.body, Message.created_at)
        .where(or_(Message.sender_id == user_id, Message.recipient_id == user_id))
        .order_by(other, Message.created_at.desc())
        .distinct(other)
        .subquery()
    )
    unread = (
        select(Message.sender_id.label("other"), func.count().label("count"))
        .where(Message.recipient_id == user_id, Message.read_at.is_(None))
        .group_by(Message.sender_id)
        .subquery()
    )
    rows = await session.execute(
        select(
            latest.c.other,
            User.full_name,
            latest.c.body,
            latest.c.created_at,
            func.coalesce(unread.c.count, 0),
        )
        .join(User, User.id == latest.c.other)
        .outerjoin(unread, unread.c.other == latest.c.other)
        .order_by(latest.c.created_at.desc())
    )
    return list(rows.all())
