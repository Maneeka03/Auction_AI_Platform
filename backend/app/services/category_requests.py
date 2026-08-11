import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.category import Category, CategoryField
from app.models.category_request import CategoryRequest, CategoryRequestStatus
from app.models.user import User
from app.schemas.category_request import (
    CreateCategoryRequestPayload,
    ReviewCategoryRequestPayload,
)
from app.services.categories import slugify


async def create(
    session: AsyncSession,
    seller: User,
    data: CreateCategoryRequestPayload,
) -> CategoryRequest:
    # If a parent is provided, make sure it exists.
    if data.parent_id is not None:
        parent = await session.get(Category, data.parent_id)

        if parent is None:
            raise AppError(
                status.HTTP_404_NOT_FOUND,
                "parent_category_not_found",
                "Parent category not found.",
            )

        # A subcategory cannot itself have subcategories.
        if parent.parent_id is not None:
            raise AppError(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "nested_too_deep",
                "A subcategory cannot have subcategories.",
            )

        # If the seller is proposing a subcategory, the request itself
        # must not contain additional subcategories.
        if data.subcategories:
            raise AppError(
                status.HTTP_422_UNPROCESSABLE_ENTITY,
                "invalid_subcategories",
                "A subcategory cannot contain subcategories.",
            )

    request = CategoryRequest(
        seller_id=seller.id,
        name=data.name.strip(),
        parent_id=data.parent_id,
        subcategories=data.subcategories,
        fields=[
            field.model_dump(mode="json")
            for field in data.fields
        ],
        status=CategoryRequestStatus.PENDING,
    )

    session.add(request)
    await session.commit()
    await session.refresh(request)

    return request


async def list_for_seller(
    session: AsyncSession,
    seller_id: uuid.UUID,
) -> list[CategoryRequest]:
    result = await session.execute(
        select(CategoryRequest)
        .where(CategoryRequest.seller_id == seller_id)
        .order_by(CategoryRequest.created_at.desc())
    )

    return list(result.scalars().all())


async def list_all(
    session: AsyncSession,
    filter_status: CategoryRequestStatus | None = None,
) -> list[CategoryRequest]:
    query = select(CategoryRequest).order_by(
        CategoryRequest.created_at.desc()
    )

    if filter_status is not None:
        query = query.where(CategoryRequest.status == filter_status)

    result = await session.execute(query)

    return list(result.scalars().all())


async def get(
    session: AsyncSession,
    request_id: uuid.UUID,
) -> CategoryRequest:
    request = await session.get(CategoryRequest, request_id)

    if request is None:
        raise AppError(
            status.HTTP_404_NOT_FOUND,
            "not_found",
            "Category request not found.",
        )

    return request


async def review(
    session: AsyncSession,
    request_id: uuid.UUID,
    reviewer: User,
    data: ReviewCategoryRequestPayload,
) -> CategoryRequest:
    request = await get(session, request_id)

    if request.status != CategoryRequestStatus.PENDING:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "already_reviewed",
            "Category request already reviewed.",
        )

    request.status = CategoryRequestStatus(data.status)
    request.admin_note = data.admin_note
    request.reviewed_by = reviewer.id
    request.reviewed_at = datetime.now(tz=timezone.utc)

    if data.status == CategoryRequestStatus.APPROVED:
        # Make sure the parent still exists if this is a subcategory request.
        parent = None

        if request.parent_id is not None:
            parent = await session.get(Category, request.parent_id)

            if parent is None:
                raise AppError(
                    status.HTTP_404_NOT_FOUND,
                    "parent_category_not_found",
                    "Parent category no longer exists.",
                )

            if parent.parent_id is not None:
                raise AppError(
                    status.HTTP_422_UNPROCESSABLE_ENTITY,
                    "nested_too_deep",
                    "A subcategory cannot itself have subcategories.",
                )

        # Create the requested category.
        category = Category(
            name=request.name,
            slug=slugify(request.name),
            parent_id=request.parent_id,
        )

        session.add(category)
        await session.flush()

        # Create requested subcategories.
        for subcategory_name in request.subcategories:
            subcategory = Category(
                name=subcategory_name.strip(),
                slug=slugify(subcategory_name),
                parent_id=category.id,
            )

            session.add(subcategory)

        # Create custom fields on the approved category.
        for field_data in request.fields:
            field = CategoryField(
                category_id=category.id,
                label=field_data["label"],
                field_type=field_data["field_type"],
                options=field_data.get("options"),
                required=field_data.get("required", False),
                sort_order=field_data.get("sort_order", 0),
            )

            session.add(field)

    await session.commit()
    await session.refresh(request)

    return request