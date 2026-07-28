import re
import uuid

from fastapi import status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import UNPROCESSABLE, AppError
from app.models.category import Category
from app.models.property import Property
from app.schemas.category import CreateCategoryRequest, UpdateCategoryRequest


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


async def get(session: AsyncSession, category_id: uuid.UUID) -> Category:
    category = await session.scalar(
        select(Category).where(Category.id == category_id).options(selectinload(Category.children))
    )
    if category is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "category_not_found", "Category not found.")
    return category


async def get_for_tenant(
    session: AsyncSession, category_id: uuid.UUID, tenant_id: uuid.UUID | None
) -> Category:
    """Fetch a category and verify it belongs to the given tenant."""
    category = await get(session, category_id)
    if tenant_id is not None and category.tenant_id != tenant_id:
        raise AppError(status.HTTP_404_NOT_FOUND, "category_not_found", "Category not found.")
    return category


async def _assert_is_main(session: AsyncSession, parent_id: uuid.UUID) -> None:
    parent = await get(session, parent_id)
    if parent.parent_id is not None:
        raise AppError(
            UNPROCESSABLE, "nested_too_deep", "A subcategory cannot itself have subcategories."
        )


async def create(
    session: AsyncSession, data: CreateCategoryRequest, tenant_id: uuid.UUID | None
) -> Category:
    if data.parent_id is not None:
        await _assert_is_main(session, data.parent_id)

    category = Category(
        name=data.name,
        slug=slugify(data.name),
        parent_id=data.parent_id,
        tenant_id=tenant_id,
    )
    session.add(category)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT,
            "category_exists",
            "A category with this name already exists at this level.",
        ) from None
    await session.refresh(category)
    return category


async def tree(session: AsyncSession, tenant_id: uuid.UUID | None) -> list[Category]:
    """Main categories for a tenant, each carrying its subcategories."""
    q = (
        select(Category)
        .where(Category.parent_id.is_(None))
        .options(selectinload(Category.children))
        .order_by(Category.name)
    )
    if tenant_id is not None:
        q = q.where(Category.tenant_id == tenant_id)
    rows = await session.scalars(q)
    return list(rows)


async def tree_all_tenants(session: AsyncSession) -> dict[uuid.UUID, list[Category]]:
    """All main categories grouped by tenant_id — used for the public discovery endpoint."""
    rows = await session.scalars(
        select(Category)
        .where(Category.parent_id.is_(None))
        .where(Category.tenant_id.is_not(None))
        .options(selectinload(Category.children))
        .order_by(Category.name)
    )
    result: dict[uuid.UUID, list[Category]] = {}
    for cat in rows:
        result.setdefault(cat.tenant_id, []).append(cat)
    return result


async def update(
    session: AsyncSession,
    category_id: uuid.UUID,
    data: UpdateCategoryRequest,
    tenant_id: uuid.UUID | None,
) -> Category:
    category = await get_for_tenant(session, category_id, tenant_id)
    fields = data.model_dump(exclude_unset=True)

    if "parent_id" in fields and fields["parent_id"] is not None:
        if fields["parent_id"] == category_id:
            raise AppError(UNPROCESSABLE, "invalid_parent", "A category cannot be its own parent.")
        if category.children:
            raise AppError(
                UNPROCESSABLE,
                "nested_too_deep",
                "This category has subcategories and cannot become one itself.",
            )
        await _assert_is_main(session, fields["parent_id"])

    if fields.get("name"):
        category.name, category.slug = fields["name"], slugify(fields["name"])
    if "parent_id" in fields:
        category.parent_id = fields["parent_id"]

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT,
            "category_exists",
            "A category with this name already exists at this level.",
        ) from None
    await session.refresh(category)
    return category


async def delete(
    session: AsyncSession, category_id: uuid.UUID, tenant_id: uuid.UUID | None
) -> None:
    category = await get_for_tenant(session, category_id, tenant_id)
    in_use = await session.scalar(
        select(func.count())
        .select_from(Property)
        .where(
            or_(
                Property.category_id == category_id,
                Property.category_id.in_(
                    select(Category.id).where(Category.parent_id == category_id)
                ),
            )
        )
    )
    if in_use:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "category_in_use",
            "Listings still use this category. Move them before deleting it.",
        )
    await session.delete(category)
    await session.commit()
