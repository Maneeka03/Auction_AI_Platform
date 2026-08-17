import re
import uuid

from fastapi import status
from sqlalchemy import func, or_, select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.errors import UNPROCESSABLE, AppError
from app.models.category import Category, CategoryField
from app.models.property import Property
from app.schemas.category import (
    CreateCategoryFieldRequest,
    CreateCategoryRequest,
    UpdateCategoryFieldRequest,
    UpdateCategoryRequest,
)


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


async def get(session: AsyncSession, category_id: uuid.UUID) -> Category:
    category = await session.scalar(
        select(Category)
        .where(Category.id == category_id)
        .options(selectinload(Category.children), selectinload(Category.fields))
    )
    if category is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "category_not_found", "Category not found.")
    return category


async def _assert_is_main(session: AsyncSession, parent_id: uuid.UUID) -> None:
    parent = await get(session, parent_id)
    if parent.parent_id is not None:
        raise AppError(
            UNPROCESSABLE, "nested_too_deep", "A subcategory cannot itself have subcategories."
        )


async def create(session: AsyncSession, data: CreateCategoryRequest) -> Category:
    if data.parent_id is not None:
        await _assert_is_main(session, data.parent_id)

    category = Category(name=data.name, slug=slugify(data.name), parent_id=data.parent_id)
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


# async def tree(session: AsyncSession) -> list[Category]:
#     rows = await session.scalars(
#         select(Category)
#         .where(Category.parent_id.is_(None))
#         .options(selectinload(Category.children), selectinload(Category.fields))
#         .order_by(Category.name)
#     )
#     return list(rows)
# async def tree(session: AsyncSession) -> list[Category]:
#     rows = await session.scalars(
#         select(Category)
#         .where(Category.parent_id.is_(None))
#         .options(
#             selectinload(Category.fields),
#             selectinload(Category.children)
#             .selectinload(Category.fields),
#             selectinload(Category.children)
#             .selectinload(Category.children),
#         )
#         .order_by(Category.name)
#     )
#     return list(rows)
async def tree(session: AsyncSession) -> list[Category]:
    rows = await session.scalars(
        select(Category)
        .where(Category.parent_id.is_(None))
        .options(
            selectinload(Category.fields),
            selectinload(Category.children)
            .selectinload(Category.fields),
            selectinload(Category.children)
            .selectinload(Category.children),
        )
        .order_by(Category.name)
    )

    categories = list(rows)

    for category in categories:
        for child in category.children:
            # Add parent category fields into subcategory fields
            child.fields = [
                *category.fields,
                *child.fields
            ]

    return categories


async def update(
    session: AsyncSession, category_id: uuid.UUID, data: UpdateCategoryRequest
) -> Category:
    category = await get(session, category_id)
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


async def delete(session: AsyncSession, category_id: uuid.UUID) -> None:
    category = await get(session, category_id)
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


# ── Custom field CRUD ──────────────────────────────────────────────────────────

async def _get_field(
    session: AsyncSession, category_id: uuid.UUID, field_id: uuid.UUID
) -> CategoryField:
    field = await session.scalar(
        select(CategoryField).where(
            CategoryField.id == field_id,
            CategoryField.category_id == category_id,
        )
    )
    if field is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "field_not_found", "Custom field not found.")
    return field


async def list_fields(session: AsyncSession, category_id: uuid.UUID) -> list[CategoryField]:
    await get(session, category_id)  # 404 if category missing
    rows = await session.scalars(
        select(CategoryField)
        .where(CategoryField.category_id == category_id)
        .order_by(CategoryField.sort_order, CategoryField.created_at)
    )
    return list(rows)


async def create_field(
    session: AsyncSession, category_id: uuid.UUID, data: CreateCategoryFieldRequest
) -> CategoryField:
    await get(session, category_id)
    field = CategoryField(
        category_id=category_id,
        label=data.label,
        field_type=data.field_type,
        options=data.options,
        required=data.required,
        sort_order=data.sort_order,
    )
    session.add(field)
    await session.commit()
    await session.refresh(field)
    return field


async def update_field(
    session: AsyncSession,
    category_id: uuid.UUID,
    field_id: uuid.UUID,
    data: UpdateCategoryFieldRequest,
) -> CategoryField:
    field = await _get_field(session, category_id, field_id)
    updates = data.model_dump(exclude_unset=True)
    for key, value in updates.items():
        setattr(field, key, value)
    await session.commit()
    await session.refresh(field)
    return field


async def delete_field(
    session: AsyncSession, category_id: uuid.UUID, field_id: uuid.UUID
) -> None:
    field = await _get_field(session, category_id, field_id)
    await session.delete(field)
    await session.commit()
