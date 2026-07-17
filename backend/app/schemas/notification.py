import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.notification import NotificationKind


class MarkReadRequest(BaseModel):
    # Omit to mark every unread notification read.
    ids: list[uuid.UUID] | None = Field(default=None, min_length=1, max_length=200)


class NotificationOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    kind: NotificationKind
    message: str
    auction_id: uuid.UUID | None
    property_id: uuid.UUID | None
    read_at: datetime | None
    created_at: datetime


class NotificationPage(BaseModel):
    items: list[NotificationOut]
    unread: int
