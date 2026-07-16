from decimal import Decimal

from pydantic import BaseModel

from app.schemas.money import Money


class TopUpRequest(BaseModel):
    amount: Money


class WalletOut(BaseModel):
    balance: Decimal
    held: Decimal
    available: Decimal
