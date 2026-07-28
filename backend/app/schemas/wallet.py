import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.wallet import WalletEntry, WalletEntryKind
from app.schemas.money import Money


class TopUpRequest(BaseModel):
    amount: Money


class WithdrawRequest(BaseModel):
    amount: Money


class WalletOut(BaseModel):
    balance: Decimal
    held: Decimal
    available: Decimal


class WalletEntryOut(BaseModel):
    """One line of activity. Signed as the user reads it: money in positive, money out negative.

    bid_hold and refund are encumbrances rather than balance movements, so these do not add up to
    the balance - read that from GET /wallet instead.
    """

    id: uuid.UUID
    kind: WalletEntryKind
    amount: Decimal
    auction_id: uuid.UUID | None
    related_to: str | None
    created_at: datetime

    @classmethod
    def of(cls, entry: WalletEntry, related_to: str | None) -> "WalletEntryOut":
        return cls(
            id=entry.id,
            kind=entry.kind,
            amount=entry.amount,
            auction_id=entry.auction_id,
            related_to=related_to,
            created_at=entry.created_at,
        )
