import uuid
from datetime import UTC, datetime

from sqlalchemy import Row, and_, case, func, or_, select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.messaging import Message
from app.models.notification import NotificationKind
from app.models.user import User, UserStatus
from app.schemas.messaging import AdminThreadOut
from app.services import notifications, users


async def send(
    session: AsyncSession,
    sender: User,
    recipient_id: uuid.UUID,
    body: str,
    property_id: uuid.UUID | None,
) -> Message:
    await users.get(session, recipient_id)  # 404s on an unknown recipient
    message = Message(
        sender_id=sender.id, recipient_id=recipient_id, body=body, property_id=property_id
    )
    session.add(message)
    # Surfaces in the bell and, being a PUSH_KIND, as a device push to the recipient.
    notifications.push(
        session,
        recipient_id,
        NotificationKind.NEW_MESSAGE,
        f"New message from {sender.full_name}",
        property_id=property_id,
    )
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


async def admin_all_threads(session: AsyncSession) -> list[AdminThreadOut]:
    """All distinct DM conversations in the system (admin oversight, read-only)."""
    a = User.__table__.alias("ua")
    b = User.__table__.alias("ub")

    # One row per ordered (sender_id, recipient_id) pair, keeping the latest message.
    latest = (
        select(
            case(
                (Message.sender_id < Message.recipient_id, Message.sender_id),
                else_=Message.recipient_id,
            ).label("user_a"),
            case(
                (Message.sender_id < Message.recipient_id, Message.recipient_id),
                else_=Message.sender_id,
            ).label("user_b"),
            Message.body,
            Message.created_at,
        )
        .order_by(
            case(
                (Message.sender_id < Message.recipient_id, Message.sender_id),
                else_=Message.recipient_id,
            ),
            case(
                (Message.sender_id < Message.recipient_id, Message.recipient_id),
                else_=Message.sender_id,
            ),
            Message.created_at.desc(),
        )
        .distinct(
            case(
                (Message.sender_id < Message.recipient_id, Message.sender_id),
                else_=Message.recipient_id,
            ),
            case(
                (Message.sender_id < Message.recipient_id, Message.recipient_id),
                else_=Message.sender_id,
            ),
        )
        .subquery()
    )

    rows = await session.execute(
        select(
            latest.c.user_a,
            a.c.full_name.label("name_a"),
            latest.c.user_b,
            b.c.full_name.label("name_b"),
            latest.c.body,
            latest.c.created_at,
        )
        .join(a, a.c.id == latest.c.user_a)
        .join(b, b.c.id == latest.c.user_b)
        .order_by(latest.c.created_at.desc())
    )
    return [
        AdminThreadOut(
            user_a_id=r.user_a,
            user_a_name=r.name_a,
            user_b_id=r.user_b,
            user_b_name=r.name_b,
            last_message=r.body,
            last_at=r.created_at,
        )
        for r in rows
    ]


async def admin_thread(
    session: AsyncSession, user_a_id: uuid.UUID, user_b_id: uuid.UUID
) -> list[tuple[Message, str]]:
    """Read any DM thread between two users (admin, read-only — does not mark read)."""
    rows = await session.execute(
        select(Message, User.full_name)
        .join(User, User.id == Message.sender_id)
        .where(
            or_(
                and_(Message.sender_id == user_a_id, Message.recipient_id == user_b_id),
                and_(Message.sender_id == user_b_id, Message.recipient_id == user_a_id),
            )
        )
        .order_by(Message.created_at)
    )
    return list(rows.all())


async def chat_search(session: AsyncSession, q: str) -> list[User]:
    """Users visible in DM/group search — all active non-deleted users."""
    pattern = f"%{q.lower()}%"
    rows = await session.scalars(
        select(User)
        .where(
            User.status == UserStatus.ACTIVE,
            or_(
                User.full_name.ilike(pattern),
                User.email.ilike(pattern),
            ),
        )
        .order_by(User.full_name)
        .limit(20)
    )
    return list(rows)
