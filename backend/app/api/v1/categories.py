import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import DbSession, effective_tenant_id, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.category import (
    CategoryOut,
    CategoryTreeOut,
    CreateCategoryRequest,
    UpdateCategoryRequest,
)
from app.services import categories

router = APIRouter(prefix="/categories", tags=["categories"])

Reader = Depends(requires(Module.ASSET_MANAGEMENT, Access.VIEW))
Manager = Depends(requires(Module.ASSET_MANAGEMENT, Access.FULL))


@router.post("", response_model=CategoryOut, status_code=status.HTTP_201_CREATED)
async def create_category(
    payload: CreateCategoryRequest,
    session: DbSession,
    actor: User = Manager,
) -> CategoryOut:
    return CategoryOut.model_validate(
        await categories.create(session, payload, effective_tenant_id(actor))
    )


@router.get("", response_model=list[CategoryTreeOut])
async def list_categories(
    session: DbSession, actor: User = Reader
) -> list[CategoryTreeOut]:
    return [
        CategoryTreeOut.model_validate(item)
        for item in await categories.tree(session, effective_tenant_id(actor))
    ]


@router.get("/{category_id}", response_model=CategoryTreeOut)
async def get_category(
    category_id: uuid.UUID, session: DbSession, actor: User = Reader
) -> CategoryTreeOut:
    return CategoryTreeOut.model_validate(
        await categories.get_for_tenant(session, category_id, effective_tenant_id(actor))
    )


@router.patch("/{category_id}", response_model=CategoryOut)
async def update_category(
    category_id: uuid.UUID,
    payload: UpdateCategoryRequest,
    session: DbSession,
    actor: User = Manager,
) -> CategoryOut:
    return CategoryOut.model_validate(
        await categories.update(session, category_id, payload, effective_tenant_id(actor))
    )


@router.delete("/{category_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_category(
    category_id: uuid.UUID, session: DbSession, actor: User = Manager
) -> None:
    await categories.delete(session, category_id, effective_tenant_id(actor))
