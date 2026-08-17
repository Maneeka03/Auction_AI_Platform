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


class AdminMessageOut(MessageOut):
    sender_name: str


class ThreadOut(BaseModel):
    """A conversation summary: who it's with, the latest line, and how many are unread."""

    user_id: uuid.UUID
    full_name: str
    last_message: str
    last_at: datetime
    unread: int


class AdminThreadOut(BaseModel):
    """Two-party conversation visible to admin in the oversight panel."""

    user_a_id: uuid.UUID
    user_a_name: str
    user_b_id: uuid.UUID
    user_b_name: str
    last_message: str
    last_at: datetime


# ── Group chats ────────────────────────────────────────────────────────────────

class CreateGroupRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    member_ids: list[uuid.UUID] = Field(min_length=1)


class GroupMemberOut(BaseModel):
    user_id: uuid.UUID
    full_name: str
    joined_at: datetime


class GroupOut(BaseModel):
    id: uuid.UUID
    name: str
    created_by: uuid.UUID | None
    created_at: datetime
    member_count: int
    last_message: str | None
    last_at: datetime | None


class SendGroupMessageRequest(BaseModel):
    body: str = Field(min_length=1, max_length=2000)


class GroupMessageOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    group_id: uuid.UUID
    sender_id: uuid.UUID
    sender_name: str
    body: str
    created_at: datetime


class ChatUserResult(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
