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
from app.schemas.category import CategoryFieldIn, CreateCategoryRequest, UpdateCategoryRequest


def slugify(name: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", name.lower()).strip("-")


def _field_rows(fields: list[CategoryFieldIn]) -> list[CategoryField]:
    """Turn field inputs into rows, deriving each key from its label and order from its position."""
    return [
        CategoryField(
            label=f.label,
            field_key=slugify(f.label),
            field_type=f.field_type,
            options=f.options,
            unit=f.unit,
            required=f.required,
            sort_order=i,
        )
        for i, f in enumerate(fields)
    ]


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
    """A subcategory may only hang off a main category, keeping the tree exactly two levels deep."""
    parent = await get(session, parent_id)
    if parent.parent_id is not None:
        raise AppError(
            UNPROCESSABLE, "nested_too_deep", "A subcategory cannot itself have subcategories."
        )


async def create(session: AsyncSession, data: CreateCategoryRequest) -> Category:
    if data.parent_id is not None:
        await _assert_is_main(session, data.parent_id)

    category = Category(
        name=data.name,
        slug=slugify(data.name),
        parent_id=data.parent_id,
        group_label=data.group_label,
        fields=_field_rows(data.fields),
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
    return await get(session, category.id)


async def tree(session: AsyncSession) -> list[Category]:
    """Main categories, each carrying its subcategories."""
    rows = await session.scalars(
        select(Category)
        .where(Category.parent_id.is_(None))
        .options(
            selectinload(Category.fields),
            selectinload(Category.children).selectinload(Category.fields),
        )
        .order_by(Category.name)
    )
    return list(rows)


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
    if "group_label" in fields:
        category.group_label = fields["group_label"]
    # A provided list replaces the whole set; delete-orphan drops the old rows on flush.
    if data.fields is not None:
        category.fields = _field_rows(data.fields)

    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT,
            "category_exists",
            "A category with this name already exists at this level.",
        ) from None
    return await get(session, category.id)


async def delete(session: AsyncSession, category_id: uuid.UUID) -> None:
    """Remove a category and its subcategories. Blocked while any listing still uses one of them."""
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
