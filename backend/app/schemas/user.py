import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.user import AuthProvider, UserStatus
from app.rbac.permissions import Role
from app.schemas.auth import Email, EmailNormalized


class CreateUserRequest(EmailNormalized):
    email: Email
    full_name: str = Field(min_length=2, max_length=120)
    roles: list[Role] = Field(min_length=1)
    country: str | None = Field(default=None, min_length=2, max_length=2)


class UpdateUserRequest(BaseModel):
    status: Literal[UserStatus.ACTIVE, UserStatus.SUSPENDED] | None = None
    roles: list[Role] | None = Field(default=None, min_length=1)
    full_name: str | None = Field(default=None, min_length=2, max_length=120)


class UserOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    email: EmailStr
    full_name: str
    status: UserStatus
    auth_provider: AuthProvider
    country: str | None
    business_type: str | None
    roles: list[Role]
    tenant_id: uuid.UUID | None
    slug: str | None
    email_verified_at: datetime | None
    last_login_at: datetime | None
    created_at: datetime


class UserPage(BaseModel):
    items: list[UserOut]
    total: int
    page: int
    size: int
