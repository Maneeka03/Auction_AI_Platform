import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.escrow import Escrow, EscrowState


class EscrowOut(BaseModel):
    id: uuid.UUID
    property_id: uuid.UUID
    property_title: str
    property_image_url: str | None
    buyer_id: uuid.UUID | None
    seller_id: uuid.UUID | None
    auction_id: uuid.UUID | None
    amount: Decimal
    state: EscrowState
    created_at: datetime
    updated_at: datetime

    @classmethod
    def of(cls, escrow: Escrow) -> "EscrowOut":
        return cls(
            id=escrow.id,
            property_id=escrow.property_id,
            property_title=escrow.listing.title,
            property_image_url=escrow.listing.image_url,
            buyer_id=escrow.buyer_id,
            seller_id=escrow.seller_id,
            auction_id=escrow.auction_id,
            amount=escrow.amount,
            state=escrow.state,
            created_at=escrow.created_at,
            updated_at=escrow.updated_at,
        )


class EscrowPage(BaseModel):
    items: list[EscrowOut]
    total: int
    page: int
    size: int
