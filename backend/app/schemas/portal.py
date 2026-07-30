import uuid
from datetime import datetime, timedelta
from decimal import Decimal

from pydantic import BaseModel

from app.models.escrow import Escrow, EscrowState
from app.schemas.bid import ParticipantOut
from app.schemas.money import Money

# Escrow releases to the seller two months after the sale (client rule).
PAYOUT_DAYS = 60


class BuyerDashboardOut(BaseModel):
    active_bids: int
    watchlist: int
    won_auctions: int
    purchases: int


class SellerDashboardOut(BaseModel):
    total_listings: int
    active_auctions: int
    total_earnings: Decimal
    pending_payouts: Decimal


class PurchaseOut(BaseModel):
    """A buyer's completed purchase, tracked through its escrow."""

    escrow_id: uuid.UUID
    property_id: uuid.UUID
    property_title: str
    property_image_url: str | None
    amount: Decimal
    state: EscrowState
    delivered_at: datetime | None
    purchased_at: datetime

    @classmethod
    def of(cls, escrow: Escrow) -> "PurchaseOut":
        return cls(
            escrow_id=escrow.id,
            property_id=escrow.property_id,
            property_title=escrow.listing.title,
            property_image_url=escrow.listing.image_url,
            amount=escrow.amount,
            state=escrow.state,
            delivered_at=escrow.delivered_at,
            purchased_at=escrow.created_at,
        )


class SellerEscrowOut(BaseModel):
    """A seller's escrow with its payout status and release countdown."""

    escrow_id: uuid.UUID
    property_id: uuid.UUID
    property_title: str
    buyer_id: uuid.UUID | None
    amount: Decimal
    state: EscrowState
    delivered_at: datetime | None
    created_at: datetime
    release_eta: datetime

    @classmethod
    def of(cls, escrow: Escrow) -> "SellerEscrowOut":
        return cls(
            escrow_id=escrow.id,
            property_id=escrow.property_id,
            property_title=escrow.listing.title,
            buyer_id=escrow.buyer_id,
            amount=escrow.amount,
            state=escrow.state,
            delivered_at=escrow.delivered_at,
            created_at=escrow.created_at,
            release_eta=escrow.created_at + timedelta(days=PAYOUT_DAYS),
        )


class ReservePriceUpdate(BaseModel):
    reserve_price: Money


class AuctionAnalysisOut(BaseModel):
    auction_id: uuid.UUID
    title: str
    reserve_price: Decimal
    winning_bid: Decimal | None
    reserve_met: bool
    total_bids: int
    bidder_count: int
    participants: list[ParticipantOut]


class DocumentVerificationOut(BaseModel):
    kyc_pending: int
    kyc_approved: int
    kyc_rejected: int
    escrow_open: int
    escrow_released: int
