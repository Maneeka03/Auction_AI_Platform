import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr

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


class ParticipantOut(BaseModel):
    """Who is in the room and what they are exposed to. Admin and supervisor eyes only."""

    model_config = ConfigDict(from_attributes=True)

    user_id: uuid.UUID
    full_name: str
    email: EmailStr
    top_bid: Decimal
    bid_count: int
    last_bid_at: datetime
