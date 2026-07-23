from typing import Literal

from pydantic import BaseModel, Field

from app.models.user import UserStatus
from app.schemas.auth import Email, EmailNormalized


class CreateSuperAdminRequest(EmailNormalized):
    email: Email
    full_name: str = Field(min_length=2, max_length=120)
    country: str | None = Field(default=None, min_length=2, max_length=2)


class UpdateSuperAdminRequest(BaseModel):
    """Edit details and/or activate/deactivate - `status` is the activate/deactivate toggle."""

    full_name: str | None = Field(default=None, min_length=2, max_length=120)
    status: Literal[UserStatus.ACTIVE, UserStatus.SUSPENDED] | None = None
