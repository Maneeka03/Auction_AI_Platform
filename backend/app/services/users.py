import uuid

from fastapi import status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.schemas.user import CreateUserRequest, UpdateUserRequest
from app.services import auth


async def create(session: AsyncSession, data: CreateUserRequest) -> User:
    user = User(
        email=data.email,
        full_name=data.full_name,
        country=data.country,
        role_rows=[UserRole(role=role) for role in set(data.roles)],
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT, "email_taken", "A user with this email already exists."
        ) from None

    await auth.send_password_link(user, "Your Provenix account is ready", "set-password")
    return user


async def get(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await session.get(User, user_id)
    if user is None or user.status is UserStatus.DELETED:
        raise AppError(status.HTTP_404_NOT_FOUND, "user_not_found", "User not found.")
    return user


async def paginate(
    session: AsyncSession,
    page: int,
    size: int,
    search: str | None,
    role: Role | None,
    user_status: UserStatus | None,
) -> tuple[list[User], int]:
    query = select(User).where(User.status != UserStatus.DELETED)
    if search:
        pattern = f"%{search.lower()}%"
        query = query.where(
            or_(User.email.ilike(pattern), func.lower(User.full_name).like(pattern))
        )
    if role:
        query = query.where(User.role_rows.any(UserRole.role == role))
    if user_status:
        query = query.where(User.status == user_status)

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(User.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


async def update(
    session: AsyncSession, actor: User, user_id: uuid.UUID, data: UpdateUserRequest
) -> User:
    user = await get(session, user_id)
    _assert_not_self(actor, user, "You cannot change your own roles or status.")

    if data.full_name is not None:
        user.full_name = data.full_name
    if data.roles is not None:
        user.role_rows = [UserRole(role=role) for role in set(data.roles)]
    if data.status is not None and data.status is not user.status:
        user.status = data.status
        if data.status is UserStatus.SUSPENDED:
            await auth.revoke_all(session, user.id)

    await session.commit()
    return user


async def soft_delete(session: AsyncSession, actor: User, user_id: uuid.UUID) -> None:
    user = await get(session, user_id)
    _assert_not_self(actor, user, "You cannot delete your own account.")

    user.status = UserStatus.DELETED
    await auth.revoke_all(session, user.id)
    await session.commit()


async def hard_delete(session: AsyncSession, actor: User, user_id: uuid.UUID) -> None:
    """Remove the account outright, including one already soft-deleted. Rows that reference the
    user fall away or null out through their own foreign keys."""
    user = await session.get(User, user_id)
    if user is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "user_not_found", "User not found.")
    _assert_not_self(actor, user, "You cannot delete your own account.")

    await session.delete(user)
    await session.commit()


def _assert_not_self(actor: User, target: User, message: str) -> None:
    if actor.id == target.id:
        raise AppError(status.HTTP_409_CONFLICT, "self_modification", message)
