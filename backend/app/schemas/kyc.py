import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, EmailStr, Field

from app.models.kyc import KycStatus, KycSubmission


class SubmitKycRequest(BaseModel):
    legal_name: str = Field(min_length=2, max_length=200)
    # Object keys from POST /uploads/presign, not URLs.
    document_keys: list[str] = Field(min_length=1, max_length=10)


class ReviewKycRequest(BaseModel):
    approved: bool
    notes: str | None = Field(default=None, max_length=2000)


class KycOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    user_id: uuid.UUID
    status: KycStatus
    legal_name: str
    document_keys: list[str]
    reviewed_at: datetime | None
    notes: str | None
    created_at: datetime


class KycReviewOut(KycOut):
    """The review queue also needs to say who is waiting, not just that someone is."""

    full_name: str
    email: EmailStr

    @classmethod
    def of(cls, submission: KycSubmission) -> "KycReviewOut":
        return cls(
            id=submission.id,
            user_id=submission.user_id,
            status=submission.status,
            legal_name=submission.legal_name,
            document_keys=submission.document_keys,
            reviewed_at=submission.reviewed_at,
            notes=submission.notes,
            created_at=submission.created_at,
            full_name=submission.user.full_name,
            email=submission.user.email,
        )


class KycPage(BaseModel):
    items: list[KycReviewOut]
    total: int
    page: int
    size: int
