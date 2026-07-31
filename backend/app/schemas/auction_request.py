import uuid
from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, Field, field_validator

from app.models.auction_request import AuctionRequest, AuctionRequestStatus


class CreateAuctionRequestPayload(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    # ISO datetime string for when the seller wants to go live (must be ≥3 days from now).
    requested_at: datetime
    property_id: uuid.UUID | None = None
    # Optional auction details — if all four are provided, the auction is auto-created on approval.
    opening_bid: Decimal | None = None
    reserve_price: Decimal | None = None
    ends_at: datetime | None = None
    increments: list[Decimal] | None = None

    @field_validator("requested_at")
    @classmethod
    def must_be_three_days_ahead(cls, v: datetime) -> datetime:
        from datetime import timezone

        now = datetime.now(tz=timezone.utc)
        if v.tzinfo is None:
            from datetime import timezone as tz
            v = v.replace(tzinfo=tz.utc)
        delta = v - now
        if delta.total_seconds() < 3 * 24 * 3600:
            raise ValueError("requested_at must be at least 3 days from now")
        return v


class ReviewAuctionRequestPayload(BaseModel):
    status: Literal["approved", "rejected"]
    admin_note: str | None = Field(default=None, max_length=2000)


class AuctionRequestOut(BaseModel):
    id: uuid.UUID
    seller_id: uuid.UUID
    seller_name: str
    seller_email: str
    property_id: uuid.UUID | None
    title: str
    description: str | None
    requested_at: datetime
    opening_bid: Decimal | None
    reserve_price: Decimal | None
    ends_at: datetime | None
    increments: list[Decimal] | None
    auction_id: uuid.UUID | None
    status: AuctionRequestStatus
    admin_note: str | None
    reviewed_by: uuid.UUID | None
    reviewer_name: str | None
    reviewed_at: datetime | None
    created_at: datetime

    @classmethod
    def of(cls, req: AuctionRequest) -> "AuctionRequestOut":
        return cls(
            id=req.id,
            seller_id=req.seller_id,
            seller_name=req.seller.full_name,
            seller_email=req.seller.email,
            property_id=req.property_id,
            title=req.title,
            description=req.description,
            requested_at=req.requested_at,
            opening_bid=req.opening_bid,
            reserve_price=req.reserve_price,
            ends_at=req.ends_at,
            increments=req.increments,
            auction_id=req.auction_id,
            status=req.status,
            admin_note=req.admin_note,
            reviewed_by=req.reviewed_by,
            reviewer_name=req.reviewer.full_name if req.reviewer else None,
            reviewed_at=req.reviewed_at,
            created_at=req.created_at,
        )
