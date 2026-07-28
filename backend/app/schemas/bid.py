import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr

from app.models.auction import Auction
from app.schemas.auction import AuctionOut
from app.schemas.money import Money


class PlaceBidRequest(BaseModel):
    amount: Money


class BidOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    auction_id: uuid.UUID
    bidder_id: uuid.UUID
    amount: Decimal
    created_at: datetime


class MyBidOut(BaseModel):
    """One auction a buyer has bid on, carrying their own highest bid and whether they won it."""

    auction: AuctionOut
    my_max_bid: Decimal
    won: bool

    @classmethod
    def of(
        cls, row: tuple[Auction, Decimal | None, int], my_max_bid: Decimal, user_id: uuid.UUID
    ) -> "MyBidOut":
        auction = AuctionOut.of(*row)
        return cls(auction=auction, my_max_bid=my_max_bid, won=auction.winner_id == user_id)


class ParticipantOut(BaseModel):
    """Who is in the room and what they are exposed to. Admin and supervisor eyes only."""

    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    top_bid: Decimal
    bid_count: int
    last_bid_at: datetime
