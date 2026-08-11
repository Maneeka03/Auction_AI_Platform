# import uuid
# from enum import StrEnum

# from sqlalchemy import Boolean, ForeignKey, String
# from sqlalchemy.dialects.postgresql import UUID
# from sqlalchemy.orm import Mapped, mapped_column

# from app.db.base import Base, TimestampMixin, pg_enum


# class BankAccountType(StrEnum):
#     SAVINGS = "savings"
#     CURRENT = "current"


# class SellerBankAccount(Base, TimestampMixin):
#     """Where a seller's auction payouts are wired.

#     One row per user - a seller updates it in place rather than keeping history, since only the
#     current details are ever used to send money. Kept in its own table (not on ``users``) so the
#     sensitive fields stay out of the identity row and any general-purpose user query.
#     """

#     __tablename__ = "seller_bank_accounts"

#     id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
#     user_id: Mapped[uuid.UUID] = mapped_column(
#         ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
#     )
#     account_holder_name: Mapped[str] = mapped_column(String(200))
#     bank_name: Mapped[str] = mapped_column(String(200))
#     account_number: Mapped[str] = mapped_column(String(34))
#     ifsc_code: Mapped[str] = mapped_column(String(11))
#     branch_name: Mapped[str | None] = mapped_column(String(200), default=None)
#     account_type: Mapped[BankAccountType] = mapped_column(
#         pg_enum(BankAccountType, "bank_account_type"), default=BankAccountType.SAVINGS
#     )
#     # A staff verification flag, separate from KYC identity checks. Cleared whenever the seller
#     # changes their details, so a stale verification can never cover new (unchecked) numbers.
#     is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

import uuid
from enum import StrEnum

from sqlalchemy import Boolean, ForeignKey, String
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.user import User


class BankAccountType(StrEnum):
    SAVINGS = "savings"
    CURRENT = "current"


class SellerBankAccount(Base, TimestampMixin):
    """Where a seller's auction payouts are wired.

    One row per user - a seller updates it in place rather than keeping history, since only the
    current details are ever used to send money. Kept in its own table (not on ``users``) so the
    sensitive fields stay out of the identity row and any general-purpose user query.
    """

    __tablename__ = "seller_bank_accounts"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    account_holder_name: Mapped[str] = mapped_column(String(200))
    bank_name: Mapped[str] = mapped_column(String(200))
    account_number: Mapped[str] = mapped_column(String(34))
    ifsc_code: Mapped[str] = mapped_column(String(11))
    branch_name: Mapped[str | None] = mapped_column(String(200), default=None)
    account_type: Mapped[BankAccountType] = mapped_column(
        pg_enum(BankAccountType, "bank_account_type"), default=BankAccountType.SAVINGS
    )
    # A staff verification flag, separate from KYC identity checks. Cleared whenever the seller
    # changes their details, so a stale verification can never cover new (unchecked) numbers.
    is_verified: Mapped[bool] = mapped_column(Boolean, default=False)

    user: Mapped[User] = relationship(lazy="selectin", foreign_keys=user_id)