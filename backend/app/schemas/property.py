import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field

from app.models.property import PropertyCategory, PropertyStatus
from app.schemas.money import Money

# SOLD is owned by the award flow, never by an edit.
EditableStatus = Literal[PropertyStatus.DRAFT, PropertyStatus.PUBLISHED]


class CreatePropertyRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    address: str = Field(min_length=2, max_length=300)
    category: PropertyCategory
    reserve_price: Money
    description: str | None = Field(default=None, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)


class UpdatePropertyRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    address: str | None = Field(default=None, min_length=2, max_length=300)
    category: PropertyCategory | None = None
    status: EditableStatus | None = None
    reserve_price: Money | None = None
    description: str | None = Field(default=None, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)


class PropertyOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    title: str
    address: str
    category: PropertyCategory
    status: PropertyStatus
    reserve_price: Decimal
    description: str | None
    image_url: str | None
    seller_id: uuid.UUID | None
    created_at: datetime


class PropertyPage(BaseModel):
    items: list[PropertyOut]
    total: int
    page: int
    size: int
