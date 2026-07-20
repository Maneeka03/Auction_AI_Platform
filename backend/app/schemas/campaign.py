import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.campaign import CampaignChannel, CampaignStatus


class CreateCampaignRequest(BaseModel):
    name: str = Field(min_length=1, max_length=160)
    channel: CampaignChannel
    body: str = Field(min_length=1)
    subject: str | None = Field(default=None, max_length=200)
    audience: str | None = Field(default=None, max_length=60)
    scheduled_at: datetime | None = None


class UpdateCampaignRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=160)
    channel: CampaignChannel | None = None
    status: CampaignStatus | None = None
    body: str | None = Field(default=None, min_length=1)
    subject: str | None = Field(default=None, max_length=200)
    audience: str | None = Field(default=None, max_length=60)
    scheduled_at: datetime | None = None


class CampaignOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    channel: CampaignChannel
    status: CampaignStatus
    subject: str | None
    body: str
    audience: str | None
    scheduled_at: datetime | None
    sent_at: datetime | None
    created_at: datetime
    updated_at: datetime


class CampaignPage(BaseModel):
    items: list[CampaignOut]
    total: int
    page: int
    size: int
