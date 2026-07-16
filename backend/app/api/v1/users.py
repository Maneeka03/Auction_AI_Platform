import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
from app.models.user import User, UserStatus
from app.rbac.permissions import Access, Module, Role
from app.schemas.user import CreateUserRequest, UpdateUserRequest, UserOut, UserPage
from app.services import users

router = APIRouter(prefix="/admin/users", tags=["user-management"])

Reader = Depends(requires(Module.USER_MANAGEMENT, Access.VIEW))
Manager = Depends(requires(Module.USER_MANAGEMENT, Access.FULL))


@router.post("", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_user(payload: CreateUserRequest, session: DbSession, _: User = Manager) -> UserOut:
    user = await users.create(session, payload)
    return UserOut.model_validate(user)


@router.get("", response_model=UserPage)
async def list_users(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=120),
    role: Role | None = None,
    status_filter: UserStatus | None = Query(None, alias="status"),
    _: User = Reader,
) -> UserPage:
    items, total = await users.paginate(session, page, size, search, role, status_filter)
    return UserPage(
        items=[UserOut.model_validate(user) for user in items],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{user_id}", response_model=UserOut)
async def get_user(user_id: uuid.UUID, session: DbSession, _: User = Reader) -> UserOut:
    return UserOut.model_validate(await users.get(session, user_id))


@router.patch("/{user_id}", response_model=UserOut)
async def update_user(
    user_id: uuid.UUID,
    payload: UpdateUserRequest,
    session: DbSession,
    actor: User = Manager,
) -> UserOut:
    user = await users.update(session, actor, user_id, payload)
    return UserOut.model_validate(user)


@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(user_id: uuid.UUID, session: DbSession, actor: User = Manager) -> None:
    await users.soft_delete(session, actor, user_id)
