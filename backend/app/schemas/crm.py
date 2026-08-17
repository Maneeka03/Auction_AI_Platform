# import uuid
# from datetime import datetime
# from decimal import Decimal

# from pydantic import BaseModel

# from app.models.user import User, UserStatus


# class BuyerCrmOut(BaseModel):
#     id: uuid.UUID
#     full_name: str
#     avatar_url: str | None
#     email: str
#     status: UserStatus
#     created_at: datetime
#     bids: int
#     auctions_won: int
#     properties_bought: int

#     @classmethod
#     def of(cls, user: User, bids: int, won: int, bought: int) -> "BuyerCrmOut":
#         return cls(
#             id=user.id,
#             full_name=user.full_name,
#             avatar_url=user.avatar_url,
#             email=user.email,
#             status=user.status,
#             created_at=user.created_at,
#             bids=bids,
#             auctions_won=won,
#             properties_bought=bought,
#         )


# class SellerCrmOut(BaseModel):
#     id: uuid.UUID
#     full_name: str
#     avatar_url: str | None
#     email: str
#     status: UserStatus
#     created_at: datetime
#     listings: int
#     sold: int
#     payouts: Decimal

#     @classmethod
#     def of(cls, user: User, listings: int, sold: int, payouts: Decimal) -> "SellerCrmOut":
#         return cls(
#             id=user.id,
#             full_name=user.full_name,
#             avatar_url=user.avatar_url,
#             email=user.email,
#             status=user.status,
#             created_at=user.created_at,
#             listings=listings,
#             sold=sold,
#             payouts=payouts,
#         )


# class BuyerCrmPage(BaseModel):
#     items: list[BuyerCrmOut]
#     total: int
#     page: int
#     size: int


# class SellerCrmPage(BaseModel):
#     items: list[SellerCrmOut]
#     total: int
#     page: int
#     size: int


# class PropertyAnalyticsOut(BaseModel):
#     property_id: uuid.UUID
#     views: int
#     unique_viewers: int
#     watchlist_count: int
#     bids: int
#     bidders: int

import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.user import User, UserStatus


def _anonymized_name(user: User) -> str:
    # Stable per-user placeholder, e.g. "Buyer #a1b2c3d4", so the same record reads consistently
    # across pages without leaking the real name.
    return f"Member #{str(user.id)[:8]}"


def _anonymized_email(user: User) -> str:
    return f"hidden-{str(user.id)[:8]}@redacted.local"


class BuyerCrmOut(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: str | None
    email: str
    status: UserStatus
    created_at: datetime
    bids: int
    auctions_won: int
    properties_bought: int
    # False for any role outside UNANONYMIZED_CRM_ROLES (see rbac/permissions.py). Lets the
    # frontend show a "name hidden" badge instead of silently rendering a placeholder as real.
    identity_visible: bool = True

    @classmethod
    def of(
        cls, user: User, bids: int, won: int, bought: int, *, unanonymized: bool = True
    ) -> "BuyerCrmOut":
        return cls(
            id=user.id,
            full_name=user.full_name if unanonymized else _anonymized_name(user),
            avatar_url=user.avatar_url if unanonymized else None,
            email=user.email if unanonymized else _anonymized_email(user),
            status=user.status,
            created_at=user.created_at,
            bids=bids,
            auctions_won=won,
            properties_bought=bought,
            identity_visible=unanonymized,
        )


class SellerCrmOut(BaseModel):
    id: uuid.UUID
    full_name: str
    avatar_url: str | None
    email: str
    status: UserStatus
    created_at: datetime
    listings: int
    sold: int
    payouts: Decimal
    identity_visible: bool = True

    @classmethod
    def of(
        cls,
        user: User,
        listings: int,
        sold: int,
        payouts: Decimal,
        *,
        unanonymized: bool = True,
    ) -> "SellerCrmOut":
        return cls(
            id=user.id,
            full_name=user.full_name if unanonymized else _anonymized_name(user),
            avatar_url=user.avatar_url if unanonymized else None,
            email=user.email if unanonymized else _anonymized_email(user),
            status=user.status,
            created_at=user.created_at,
            listings=listings,
            sold=sold,
            payouts=payouts,
            identity_visible=unanonymized,
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
