import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.user import User, UserStatus


class BuyerCrmOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    status: UserStatus
    created_at: datetime
    bids: int
    auctions_won: int
    properties_bought: int

    @classmethod
    def of(cls, user: User, bids: int, won: int, bought: int) -> "BuyerCrmOut":
        return cls(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            status=user.status,
            created_at=user.created_at,
            bids=bids,
            auctions_won=won,
            properties_bought=bought,
        )


class SellerCrmOut(BaseModel):
    id: uuid.UUID
    full_name: str
    email: str
    status: UserStatus
    created_at: datetime
    listings: int
    sold: int
    payouts: Decimal

    @classmethod
    def of(cls, user: User, listings: int, sold: int, payouts: Decimal) -> "SellerCrmOut":
        return cls(
            id=user.id,
            full_name=user.full_name,
            email=user.email,
            status=user.status,
            created_at=user.created_at,
            listings=listings,
            sold=sold,
            payouts=payouts,
        )


class BuyerCrmPage(BaseModel):
    items: list[BuyerCrmOut]
    total: int
    page: int
    size: int


class SellerCrmPage(BaseModel):
    items: list[SellerCrmOut]
    total: int
    page: int
    size: int


class PropertyAnalyticsOut(BaseModel):
    property_id: uuid.UUID
    views: int
    unique_viewers: int
    watchlist_count: int
    bids: int
    bidders: int
