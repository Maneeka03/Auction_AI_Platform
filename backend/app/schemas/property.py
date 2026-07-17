import uuid
from datetime import datetime
from decimal import Decimal
from typing import Annotated, Literal

from pydantic import BaseModel, Field

from app.models.property import Property, PropertyCategory, PropertyStatus
from app.schemas.money import Money

# SOLD is owned by the award flow, never by an edit.
EditableStatus = Literal[PropertyStatus.DRAFT, PropertyStatus.PUBLISHED]


Bedrooms = Annotated[int, Field(ge=0, le=100)]
Area = Annotated[int, Field(ge=1, le=10_000_000)]


class CreatePropertyRequest(BaseModel):
    title: str = Field(min_length=2, max_length=200)
    address: str = Field(min_length=2, max_length=300)
    category: PropertyCategory
    reserve_price: Money
    description: str | None = Field(default=None, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)
    bedrooms: Bedrooms | None = None
    bathrooms: Bedrooms | None = None
    area_sqft: Area | None = None


class UpdatePropertyRequest(BaseModel):
    title: str | None = Field(default=None, min_length=2, max_length=200)
    address: str | None = Field(default=None, min_length=2, max_length=300)
    category: PropertyCategory | None = None
    status: EditableStatus | None = None
    reserve_price: Money | None = None
    description: str | None = Field(default=None, max_length=5000)
    image_url: str | None = Field(default=None, max_length=500)
    bedrooms: Bedrooms | None = None
    bathrooms: Bedrooms | None = None
    area_sqft: Area | None = None


class PropertyOut(BaseModel):
    id: uuid.UUID
    title: str
    address: str
    category: PropertyCategory
    status: PropertyStatus
    reserve_price: Decimal
    description: str | None
    image_url: str | None
    bedrooms: int | None
    bathrooms: int | None
    area_sqft: int | None
    seller_id: uuid.UUID | None
    seller_name: str | None
    created_at: datetime

    @classmethod
    def of(cls, listing: Property) -> "PropertyOut":
        return cls(
            id=listing.id,
            title=listing.title,
            address=listing.address,
            category=listing.category,
            status=listing.status,
            reserve_price=listing.reserve_price,
            description=listing.description,
            image_url=listing.image_url,
            bedrooms=listing.bedrooms,
            bathrooms=listing.bathrooms,
            area_sqft=listing.area_sqft,
            seller_id=listing.seller_id,
            seller_name=listing.seller.full_name if listing.seller else None,
            created_at=listing.created_at,
        )


class PropertyPage(BaseModel):
    items: list[PropertyOut]
    total: int
    page: int
    size: int
