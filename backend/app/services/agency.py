import uuid

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.schemas.agency import CreateSuperAdminRequest, UpdateSuperAdminRequest
from app.schemas.user import CreateUserRequest, UpdateUserRequest
from app.services import users


async def _super_admin(session: AsyncSession, user_id: uuid.UUID) -> User:
    user = await users.get(session, user_id)  # 404s on a missing or deleted user
    if Role.SUPER_ADMIN not in user.roles:
        raise AppError(status.HTTP_404_NOT_FOUND, "user_not_found", "Super admin not found.")
    return user


async def paginate(
    session: AsyncSession, page: int, size: int, search: str | None, user_status: UserStatus | None
) -> tuple[list[User], int]:
    return await users.paginate(session, page, size, search, Role.SUPER_ADMIN, user_status)


async def get(session: AsyncSession, user_id: uuid.UUID) -> User:
    return await _super_admin(session, user_id)


async def create(session: AsyncSession, data: CreateSuperAdminRequest) -> User:
    return await users.create(
        session,
        CreateUserRequest(
            email=data.email,
            full_name=data.full_name,
            country=data.country,
            roles=[Role.SUPER_ADMIN],
        ),
    )


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
