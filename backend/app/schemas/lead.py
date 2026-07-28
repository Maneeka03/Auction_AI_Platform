import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.lead import LeadStatus


class CreateLeadRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    company_name: str | None = Field(default=None, max_length=160)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    source: str | None = Field(default=None, max_length=60)
    status: LeadStatus = LeadStatus.NEW
    notes: str | None = Field(default=None, max_length=5000)


class UpdateLeadRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    company_name: str | None = Field(default=None, max_length=160)
    email: EmailStr | None = None
    phone: str | None = Field(default=None, max_length=40)
    source: str | None = Field(default=None, max_length=60)
    status: LeadStatus | None = None
    notes: str | None = Field(default=None, max_length=5000)


class LeadOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    company_name: str | None
    email: str | None
    phone: str | None
    source: str | None
    status: LeadStatus
    notes: str | None
    owner_id: uuid.UUID | None
    created_at: datetime
    updated_at: datetime


class LeadPage(BaseModel):
    items: list[LeadOut]
    total: int
    page: int
    size: int
