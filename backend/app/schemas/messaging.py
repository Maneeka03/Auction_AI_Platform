import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class SendMessageRequest(BaseModel):
    recipient_id: uuid.UUID
    body: str = Field(min_length=1, max_length=2000)
    property_id: uuid.UUID | None = None


class MessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    sender_id: uuid.UUID
    recipient_id: uuid.UUID
    property_id: uuid.UUID | None
    body: str
    read_at: datetime | None
    created_at: datetime


class ThreadOut(BaseModel):
    """A conversation summary: who it's with, the latest line, and how many are unread."""

    user_id: uuid.UUID
    full_name: str
    last_message: str
    last_at: datetime
    unread: int
