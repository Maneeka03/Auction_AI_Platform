from typing import Literal

from pydantic import BaseModel, Field

from app.models.user import UserStatus
from app.schemas.auth import Email, EmailNormalized


class CreateSuperAdminRequest(EmailNormalized):
    email: Email
    full_name: str = Field(min_length=2, max_length=120)
    country: str | None = Field(default=None, min_length=2, max_length=2)
    password: str | None = Field(default=None, min_length=8, max_length=128)
    slug: str | None = Field(default=None, min_length=2, max_length=80, pattern=r"^[a-z0-9-]+$")


class UpdateSuperAdminRequest(BaseModel):
    """Edit details and/or activate/deactivate - `status` is the activate/deactivate toggle."""

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    status: Literal[UserStatus.ACTIVE, UserStatus.SUSPENDED] | None = None


class UserBrandingOut(BaseModel):
    platform_name: str | None = None
    logo_url: str | None = None
    primary_color: str | None = None


class UpdateUserBrandingRequest(BaseModel):
    platform_name: str | None = Field(default=None, max_length=120)
    logo_url: str | None = None
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")
