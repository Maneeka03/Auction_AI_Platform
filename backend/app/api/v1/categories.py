import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.category import (
    CategoryFieldOut,
    CategoryOut,
    CategoryTreeOut,
    CreateCategoryFieldRequest,
    CreateCategoryRequest,
    UpdateCategoryFieldRequest,
    UpdateCategoryRequest,
)
from app.services import categories

router = APIRouter(prefix="/categories", tags=["categories"])

Reader = Depends(requires(Module.ASSET_MANAGEMENT, Access.VIEW))
Manager = Depends(requires(Module.ASSET_MANAGEMENT, Access.FULL))


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CreateCategoryRequest, session: DbSession, _: User = Manager
) -> CategoryOut:
    return CategoryOut.model_validate(await categories.create(session, payload))


@router.get("", response_model=list[CategoryTreeOut])
async def list_categories(session: DbSession, _: User = Reader) -> list[CategoryTreeOut]:
    return [CategoryTreeOut.model_validate(item) for item in await categories.tree(session)]


@router.get("/public", response_model=list[CategoryTreeOut])
async def public_categories(session: DbSession) -> list[CategoryTreeOut]:
    return [CategoryTreeOut.model_validate(item) for item in await categories.tree(session)]


@router.get("/{category_id}", response_model=CategoryTreeOut)
async def get_category(
    category_id: uuid.UUID, session: DbSession, _: User = Reader
) -> CategoryTreeOut:
    return CategoryTreeOut.model_validate(await categories.get(session, category_id))


@router.patch("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: uuid.UUID,
    payload: UpdateCategoryRequest,
    session: DbSession,
    _: User = Manager,
) -> CategoryOut:
    return CategoryOut.model_validate(await categories.update(session, category_id, payload))


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(category_id: uuid.UUID, session: DbSession, _: User = Manager) -> None:
    await categories.delete(session, category_id)


# ── Custom fields ──────────────────────────────────────────────────────────────

@router.get("/{category_id}/fields/public", response_model=list[CategoryFieldOut])
async def list_fields_public(
    category_id: uuid.UUID, session: DbSession
) -> list[CategoryFieldOut]:
    """Public — seller form fetches this to build the dynamic input UI."""
    return [
        CategoryFieldOut.model_validate(f)
        for f in await categories.list_fields(session, category_id)
    ]


@router.get("/{category_id}/fields", response_model=list[CategoryFieldOut])
async def list_fields(
    category_id: uuid.UUID, session: DbSession, _: User = Reader
) -> list[CategoryFieldOut]:
    return [
        CategoryFieldOut.model_validate(f)
        for f in await categories.list_fields(session, category_id)
    ]


@router.post(
    "/{category_id}/fields",
    response_model=CategoryFieldOut,
    status_code=status.HTTP_201_CREATED,
)
async def create_field(
    category_id: uuid.UUID,
    payload: CreateCategoryFieldRequest,
    session: DbSession,
    _: User = Manager,
) -> CategoryFieldOut:
    return CategoryFieldOut.model_validate(
        await categories.create_field(session, category_id, payload)
    )


@router.patch("/{category_id}/fields/{field_id}", response_model=CategoryFieldOut)
async def update_field(
    category_id: uuid.UUID,
    field_id: uuid.UUID,
    payload: UpdateCategoryFieldRequest,
    session: DbSession,
    _: User = Manager,
) -> CategoryFieldOut:
    return CategoryFieldOut.model_validate(
        await categories.update_field(session, category_id, field_id, payload)
    )


@router.delete("/{category_id}/fields/{field_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_field(
    category_id: uuid.UUID,
    field_id: uuid.UUID,
    session: DbSession,
    _: User = Manager,
) -> None:
    await categories.delete_field(session, category_id, field_id)
