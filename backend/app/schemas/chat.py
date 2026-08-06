import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.chat import AuctionChatMessage


class CreateChatMessageRequest(BaseModel):
    body: str = Field(min_length=1, max_length=1000)


class ChatMessageOut(BaseModel):
    id: uuid.UUID
    auction_id: uuid.UUID
    user_id: uuid.UUID
    author_name: str
    body: str
    created_at: datetime

    @classmethod
    def of(cls, msg: AuctionChatMessage) -> "ChatMessageOut":
        return cls(
            id=msg.id,
            auction_id=msg.auction_id,
            user_id=msg.user_id,
            author_name=msg.user.full_name,
            body=msg.body,
            created_at=msg.created_at,
        )
