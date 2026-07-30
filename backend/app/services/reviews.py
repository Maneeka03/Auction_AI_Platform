import uuid

from fastapi import status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.escrow import Escrow
from app.models.review import Review
from app.models.user import User
from app.schemas.review import CreateReviewRequest


async def create(session: AsyncSession, author: User, data: CreateReviewRequest) -> Review:
    """Only a buyer who actually bought the item (has an escrow for it) may review its seller."""
    escrow = await session.scalar(
        select(Escrow).where(
            Escrow.buyer_id == author.id, Escrow.property_id == data.property_id
        )
    )
    if escrow is None or escrow.seller_id is None:
        raise AppError(
            status.HTTP_403_FORBIDDEN, "not_purchased", "You can only review items you have bought."
        )

    review = Review(
        author=author,
        seller_id=escrow.seller_id,
        property_id=data.property_id,
        rating=data.rating,
        body=data.body,
    )
    session.add(review)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT, "already_reviewed", "You have already reviewed this item."
        ) from None
    return review


async def for_seller(session: AsyncSession, seller_id: uuid.UUID) -> list[Review]:
    rows = await session.scalars(
        select(Review).where(Review.seller_id == seller_id).order_by(Review.created_at.desc())
    )
    return list(rows)


async def for_property(session: AsyncSession, property_id: uuid.UUID) -> list[Review]:
    rows = await session.scalars(
        select(Review).where(Review.property_id == property_id).order_by(Review.created_at.desc())
    )
    return list(rows)
