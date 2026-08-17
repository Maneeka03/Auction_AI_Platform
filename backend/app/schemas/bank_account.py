# import re
# import uuid
# from datetime import datetime

# from pydantic import BaseModel, ConfigDict, Field, field_validator

# from app.models.bank_account import BankAccountType, SellerBankAccount

# IFSC_PATTERN = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


# class UpsertBankAccountRequest(BaseModel):
#     account_holder_name: str = Field(min_length=2, max_length=200)
#     bank_name: str = Field(min_length=2, max_length=200)
#     account_number: str = Field(min_length=6, max_length=34)
#     ifsc_code: str = Field(min_length=11, max_length=11)
#     branch_name: str | None = Field(default=None, max_length=200)
#     account_type: BankAccountType = BankAccountType.SAVINGS

#     @field_validator("account_number")
#     @classmethod
#     def _account_number_digits(cls, value: str) -> str:
#         if not value.isalnum():
#             raise ValueError("Account number may only contain letters and digits.")
#         return value

#     @field_validator("ifsc_code")
#     @classmethod
#     def _ifsc_format(cls, value: str) -> str:
#         value = value.strip().upper()
#         if not IFSC_PATTERN.match(value):
#             raise ValueError("Enter a valid 11-character IFSC code, e.g. HDFC0001234.")
#         return value


# class BankAccountOut(BaseModel):
#     model_config = ConfigDict(from_attributes=True)

#     id: uuid.UUID
#     account_holder_name: str
#     bank_name: str
#     # Masked - only the last 4 digits are ever sent back to the client.
#     account_number_masked: str
#     ifsc_code: str
#     branch_name: str | None
#     account_type: BankAccountType
#     is_verified: bool
#     updated_at: datetime

#     @classmethod
#     def of(cls, account: SellerBankAccount) -> "BankAccountOut":
#         tail = account.account_number[-4:]
#         masked = f"{'•' * max(len(account.account_number) - 4, 0)}{tail}"
#         return cls(
#             id=account.id,
#             account_holder_name=account.account_holder_name,
#             bank_name=account.bank_name,
#             account_number_masked=masked,
#             ifsc_code=account.ifsc_code,
#             branch_name=account.branch_name,
#             account_type=account.account_type,
#             is_verified=account.is_verified,
#             updated_at=account.updated_at,
#         )

import re
import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field, field_validator

from app.models.bank_account import BankAccountType, SellerBankAccount


IFSC_PATTERN = re.compile(r"^[A-Z]{4}0[A-Z0-9]{6}$")


class UpsertBankAccountRequest(BaseModel):
    account_holder_name: str = Field(min_length=2, max_length=200)
    bank_name: str = Field(min_length=2, max_length=200)
    account_number: str = Field(min_length=6, max_length=34)
    ifsc_code: str = Field(min_length=11, max_length=11)
    branch_name: str | None = Field(default=None, max_length=200)
    account_type: BankAccountType = BankAccountType.SAVINGS

    @field_validator("account_number")
    @classmethod
    def validate_account_number(cls, value: str) -> str:
        if not value.isalnum():
            raise ValueError("Account number may only contain letters and digits.")
        return value

    @field_validator("ifsc_code")
    @classmethod
    def validate_ifsc(cls, value: str) -> str:
        value = value.strip().upper()
        if not IFSC_PATTERN.match(value):
            raise ValueError(
                "Enter a valid 11-character IFSC code, e.g. HDFC0001234."
            )
        return value


class BankAccountOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    account_holder_name: str
    bank_name: str
    account_number_masked: str
    ifsc_code: str
    branch_name: str | None
    account_type: BankAccountType
    is_verified: bool
    updated_at: datetime

    @classmethod
    def of(cls, account: SellerBankAccount) -> "BankAccountOut":
        tail = account.account_number[-4:]
        masked = f"{'•' * max(len(account.account_number) - 4, 0)}{tail}"

        return cls(
            id=account.id,
            account_holder_name=account.account_holder_name,
            bank_name=account.bank_name,
            account_number_masked=masked,
            ifsc_code=account.ifsc_code,
            branch_name=account.branch_name,
            account_type=account.account_type,
            is_verified=account.is_verified,
            updated_at=account.updated_at,
        )


class ReviewBankAccountRequest(BaseModel):
    approved: bool


class BankAccountReviewOut(BankAccountOut):
    @classmethod
    def of(cls, account: SellerBankAccount) -> "BankAccountReviewOut":
        return cls(**BankAccountOut.of(account).model_dump())


class BankAccountPage(BaseModel):
    items: list[BankAccountReviewOut]
    total: int
    page: int
    size: int