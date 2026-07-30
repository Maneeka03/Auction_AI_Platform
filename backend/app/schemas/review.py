import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.review import Review


class CreateReviewRequest(BaseModel):
    property_id: uuid.UUID
    rating: int = Field(ge=1, le=5)
    body: str | None = Field(default=None, max_length=2000)


class ReviewOut(BaseModel):
    id: uuid.UUID
    author_id: uuid.UUID
    author_name: str
    seller_id: uuid.UUID
    property_id: uuid.UUID
    rating: int
    body: str | None
    created_at: datetime

    @classmethod
    def of(cls, review: Review) -> "ReviewOut":
        return cls(
            id=review.id,
            author_id=review.author_id,
            author_name=review.author.full_name,
            seller_id=review.seller_id,
            property_id=review.property_id,
            rating=review.rating,
            body=review.body,
            created_at=review.created_at,
        )
