import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.comment import AuctionComment


class CreateCommentRequest(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class CommentOut(BaseModel):
    id: uuid.UUID
    auction_id: uuid.UUID
    user_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime

    @classmethod
    def of(cls, comment: AuctionComment) -> "CommentOut":
        return cls(
            id=comment.id,
            auction_id=comment.auction_id,
            user_id=comment.user_id,
            author_name=comment.user.full_name,
            body=comment.body,
            created_at=comment.created_at,
        )
