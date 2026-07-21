import uuid
from datetime import UTC, datetime
from decimal import Decimal
from typing import Annotated

from pydantic import AwareDatetime, BaseModel, Field, model_validator

from app.models.auction import Auction, AuctionStatus, RoomAccess
from app.schemas.money import Money

# 100 = the bidder must have the whole bid free in their wallet; lower takes a token deposit.
TokenPercent = Annotated[Decimal, Field(gt=0, le=100, max_digits=5, decimal_places=2)]
Increments = Annotated[list[Money], Field(min_length=1, max_length=6)]


class CreateAuctionRequest(BaseModel):
    property_id: uuid.UUID
    starts_at: AwareDatetime
    ends_at: AwareDatetime
    opening_bid: Money
    reserve_price: Money
    increments: Increments
    room_access: RoomAccess = RoomAccess.OPEN
    token_percent: TokenPercent = Decimal(100)

    @model_validator(mode="after")
    def _check_window(self) -> "CreateAuctionRequest":
        if self.ends_at <= self.starts_at:
            raise ValueError("ends_at must be after starts_at")
        if self.ends_at <= datetime.now(UTC):
            raise ValueError("ends_at must be in the future")
        return self


class UpdateAuctionRequest(BaseModel):
    ends_at: AwareDatetime | None = None
    reserve_price: Money | None = None
    room_access: RoomAccess | None = None
    increments: Increments | None = None


class AwardRequest(BaseModel):
    bidder_id: uuid.UUID


class InviteRequest(BaseModel):
    user_ids: list[uuid.UUID] = Field(min_length=1, max_length=200)


class AuctionOut(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    title: str
    address: str
    category_id: uuid.UUID
    category_name: str
    image_url: str | None
    status: AuctionStatus
    starts_at: datetime
    ends_at: datetime
    ended_at: datetime | None
    opening_bid: Decimal
    reserve_price: Decimal
    current_bid: Decimal | None
    minimum_bid: Decimal
    increments: list[Decimal]
    room_access: RoomAccess
    token_percent: Decimal
    bidder_count: int
    winner_id: uuid.UUID | None

    @classmethod
    def of(cls, auction: Auction, current_bid: Decimal | None, bidder_count: int) -> "AuctionOut":
        return cls(
            id=auction.id,
            property_id=auction.property_id,
            title=auction.listing.title,
            address=auction.listing.address,
            category_id=auction.listing.category_id,
            category_name=auction.listing.category.name,
            image_url=auction.listing.image_url,
            status=auction.status,
            starts_at=auction.starts_at,
            ends_at=auction.ends_at,
            ended_at=auction.ended_at,
            opening_bid=auction.opening_bid,
            reserve_price=auction.reserve_price,
            current_bid=current_bid,
            minimum_bid=auction.minimum_bid(current_bid),
            increments=auction.increments,
            room_access=auction.room_access,
            token_percent=auction.token_percent,
            bidder_count=bidder_count,
            winner_id=auction.winner_id,
        )


class AuctionPage(BaseModel):
    items: list[AuctionOut]
    total: int
    page: int
    size: int
