import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
from app.models.user import User, UserStatus
from app.rbac.permissions import Access, Module
from app.schemas.agency import CreateSuperAdminRequest, UpdateSuperAdminRequest
from app.schemas.sidebar import SaveSidebarRequest, SidebarEntryOut, SidebarItemOut
from app.schemas.user import UserOut, UserPage
from app.services import agency, sidebar

router = APIRouter(prefix="/agency", tags=["agency"])

# Only the agency admin holds full agency_administration; every other role is denied by the matrix.
Admin = Depends(requires(Module.AGENCY_ADMINISTRATION, Access.FULL))


@router.post("/super-admins", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def create_super_admin(
    payload: CreateSuperAdminRequest, session: DbSession, _: User = Admin
) -> UserOut:
    return UserOut.model_validate(await agency.create(session, payload))


@router.get("/super-admins", response_model=UserPage)
async def list_super_admins(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=120),
    status_filter: UserStatus | None = Query(None, alias="status"),
    _: User = Admin,
) -> UserPage:
    items, total = await agency.paginate(session, page, size, search, status_filter)
    return UserPage(
        items=[UserOut.model_validate(item) for item in items], total=total, page=page, size=size
    )


@router.get("/super-admins/{user_id}", response_model=UserOut)
async def get_super_admin(user_id: uuid.UUID, session: DbSession, _: User = Admin) -> UserOut:
    return UserOut.model_validate(await agency.get(session, user_id))


@router.patch("/super-admins/{user_id}", response_model=UserOut)
async def update_super_admin(
    user_id: uuid.UUID,
    payload: UpdateSuperAdminRequest,
    session: DbSession,
    actor: User = Admin,
) -> UserOut:
    """Edit details and/or activate/deactivate - pass `status` to toggle active/suspended."""
    return UserOut.model_validate(await agency.update(session, actor, user_id, payload))


@router.delete("/super-admins/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_super_admin(
    user_id: uuid.UUID,
    session: DbSession,
    hard: bool = Query(False),
    actor: User = Admin,
) -> None:
    await agency.delete(session, actor, user_id, hard)


@router.get("/sidebar/items", response_model=list[SidebarItemOut])
async def list_sidebar_items(session: DbSession, _: User = Admin) -> list[SidebarItemOut]:
    """The fixed catalogue of every menu item available to add to the sidebar."""
    return [SidebarItemOut.model_validate(item) for item in await sidebar.catalogue(session)]


@router.get("/sidebar", response_model=list[SidebarEntryOut])
async def get_sidebar(session: DbSession, actor: User = Admin) -> list[SidebarEntryOut]:
    """This admin's saved sidebar - visibility and order applied, defaults where unset."""
    return [_entry(row) for row in await sidebar.config(session, actor.id)]


@router.put("/sidebar", response_model=list[SidebarEntryOut])
async def save_sidebar(
    payload: SaveSidebarRequest, session: DbSession, actor: User = Admin
) -> list[SidebarEntryOut]:
    return [_entry(row) for row in await sidebar.save(session, actor.id, payload.items)]


def _entry(row) -> SidebarEntryOut:
    return SidebarEntryOut(
        item_id=row[0], key=row[1], label=row[2], visible=row[3], position=row[4]
    )
