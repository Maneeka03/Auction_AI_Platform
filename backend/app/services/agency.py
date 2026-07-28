import re
import uuid

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core.security import hash_password
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.schemas.agency import CreateSuperAdminRequest, UpdateSuperAdminRequest
from app.schemas.user import UpdateUserRequest
from app.services import auth, users


def _base_slug(name: str) -> str:
    """Turn a full name into a URL-safe slug: "John Doe" → "john-doe"."""
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


async def _unique_slug(session: AsyncSession, base: str) -> str:
    """Append a counter until the slug is unique in the users table."""
    candidate = base
    counter = 2
    while True:
        existing = await session.scalar(select(User).where(User.slug == candidate))
        if existing is None:
            return candidate
        candidate = f"{base}-{counter}"
        counter += 1


async def _super_admin(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await users.get(session, user_id)
    if Role.SUPER_ADMIN not in user.roles:
        raise AppError(status.HTTP_404_NOT_FOUND, "user_not_found", "Super admin not found.")
    return user


async def paginate(
    session: AsyncSession, page: int, size: int, search: str | None, user_status: UserStatus | None
) -> tuple[list[User], int]:
    return await users.paginate(session, page, size, search, Role.SUPER_ADMIN, user_status)


async def get(session: AsyncSession, user_id: uuid.UUID) -> User:
    return await _super_admin(session, user_id)


async def get_by_slug(session: AsyncSession, slug: str) -> User:
    user = await session.scalar(select(User).where(User.slug == slug))
    if user is None or Role.SUPER_ADMIN not in user.roles:
        raise AppError(status.HTTP_404_NOT_FOUND, "tenant_not_found", "Tenant not found.")
    return user


async def create(session: AsyncSession, data: CreateSuperAdminRequest) -> User:
    # Generate slug from provided value or derive from full_name
    raw_slug = data.slug if getattr(data, "slug", None) else _base_slug(data.full_name)
    slug = await _unique_slug(session, raw_slug)

    user = User(
        email=data.email,
        full_name=data.full_name,
        country=data.country,
        slug=slug,
        password_hash=hash_password(data.password) if data.password else None,
        role_rows=[UserRole(role=Role.SUPER_ADMIN)],
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT, "email_taken", "A user with this email already exists."
        ) from None

    if not data.password:
        await auth.send_password_link(user, "Your account is ready", "set-password")
    return user


async def update(
    session: AsyncSession, actor: User, user_id: uuid.UUID, data: UpdateSuperAdminRequest
) -> User:
    await _super_admin(session, user_id)
    return await users.update(
        session, actor, user_id, UpdateUserRequest(full_name=data.full_name, status=data.status)
    )


async def delete(session: AsyncSession, actor: User, user_id: uuid.UUID, hard: bool) -> None:
    await _super_admin(session, user_id)
    remaining = await session.scalar(
        select(func.count())
        .select_from(User)
        .where(
            User.status != UserStatus.DELETED,
            User.role_rows.any(UserRole.role == Role.SUPER_ADMIN),
        )
    )
    if remaining <= 1:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "last_super_admin",
            "The last super admin cannot be removed.",
        )
    if hard:
        await users.hard_delete(session, actor, user_id)
    else:
        await users.soft_delete(session, actor, user_id)
