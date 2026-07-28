import uuid
from datetime import datetime
from typing import Annotated, Literal

from pydantic import BaseModel, EmailStr, Field, field_validator

from app.models.user import User, UserStatus
from app.rbac.permissions import Role, permissions_for

Password = Annotated[str, Field(min_length=12, max_length=128)]
Email = Annotated[EmailStr, Field(max_length=320)]


class EmailNormalized(BaseModel):
    @field_validator("email", check_fields=False)
    @classmethod
    def _normalize_email(cls, value: str) -> str:
        return value.strip().lower()


class RegisterRequest(EmailNormalized):
    email: Email
    password: Password
    full_name: str = Field(min_length=2, max_length=120)
    role: Literal[Role.BUYER, Role.SELLER]
    country: str | None = Field(default=None, min_length=2, max_length=2)
    business_type: str | None = Field(default=None, max_length=40)


class SellerEnrolmentRequest(BaseModel):
    business_type: str | None = Field(default=None, max_length=40)


class LoginRequest(EmailNormalized):
    email: Email
    password: str = Field(max_length=128)


class EmailRequest(EmailNormalized):
    email: Email


class TokenRequest(BaseModel):
    token: str = Field(min_length=16, max_length=2048)


class ResetPasswordRequest(TokenRequest):
    password: Password


class ChangePasswordRequest(BaseModel):
    current_password: str = Field(max_length=128)
    new_password: Password


class AccessToken(BaseModel):
    access_token: str
    token_type: Literal["bearer"] = "bearer"
    expires_in: int


class Session(BaseModel):
    id: uuid.UUID
    email: EmailStr
    full_name: str
    status: UserStatus
    country: str | None
    business_type: str | None
    email_verified_at: datetime | None
    last_login_at: datetime | None
    roles: list[Role]
    permissions: dict[str, str]

    @classmethod
    def of(cls, user: User) -> "Session":
        return cls(
            id=user.id,
            email=user.email,
            full_name=user.full_name,
            status=user.status,
            country=user.country,
            business_type=user.business_type,
            email_verified_at=user.email_verified_at,
            last_login_at=user.last_login_at,
            roles=user.roles,
            permissions=permissions_for(user.roles),
        )


class Message(BaseModel):
    message: str
