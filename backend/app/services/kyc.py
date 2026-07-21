import uuid
from datetime import UTC, datetime

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.kyc import KycStatus, KycSubmission
from app.models.notification import NotificationKind
from app.models.user import User
from app.services import notifications, uploads


async def submit(
    session: AsyncSession, user: User, legal_name: str, document_keys: list[str]
) -> KycSubmission:
    """Create the user's submission, or replace a rejected one. Approved packs are final."""
    existing = await session.scalar(
        select(KycSubmission).where(KycSubmission.user_id == user.id).with_for_update()
    )
    if existing is None:
        existing = KycSubmission(user_id=user.id)
        session.add(existing)
    elif existing.status is KycStatus.APPROVED:
        raise AppError(
            status.HTTP_409_CONFLICT, "already_verified", "Your identity is already verified."
        )

    existing.legal_name = legal_name
    existing.document_keys = document_keys
    existing.status = KycStatus.PENDING
    existing.reviewer_id, existing.reviewed_at, existing.notes = None, None, None
    await session.commit()
    return existing


async def mine(session: AsyncSession, user_id: uuid.UUID) -> KycSubmission | None:
    return await session.scalar(select(KycSubmission).where(KycSubmission.user_id == user_id))


async def require_verified(session: AsyncSession, user_id: uuid.UUID) -> None:
    """Gate a money-moving action on an approved identity pack. Raises 403 otherwise."""
    verified = await session.scalar(
        select(KycSubmission.status).where(KycSubmission.user_id == user_id)
    )
    if verified is not KycStatus.APPROVED:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "kyc_required",
            "Verify your identity before bidding or buying.",
        )


async def paginate(
    session: AsyncSession, page: int, size: int, kyc_status: KycStatus | None
) -> tuple[list[KycSubmission], int]:
    query = select(KycSubmission)
    if kyc_status:
        query = query.where(KycSubmission.status == kyc_status)

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(KycSubmission.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


async def review(
    session: AsyncSession,
    reviewer: User,
    submission_id: uuid.UUID,
    approved: bool,
    notes: str | None,
) -> KycSubmission:
    submission = await session.get(KycSubmission, submission_id)
    if submission is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "kyc_not_found", "Submission not found.")
    if submission.status is not KycStatus.PENDING:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "already_reviewed",
            "This submission has already been reviewed.",
        )

    submission.status = KycStatus.APPROVED if approved else KycStatus.REJECTED
    submission.reviewer_id = reviewer.id
    submission.reviewed_at = datetime.now(UTC)
    submission.notes = notes
    notifications.push(
        session,
        submission.user_id,
        NotificationKind.KYC_REVIEWED,
        f"Your identity verification was {submission.status.value}.",
    )
    await session.commit()
    return submission


async def document_url(session: AsyncSession, submission_id: uuid.UUID, key: str) -> str:
    """A signed link to one uploaded document, scoped to its own submission.

    Checking the key against this submission's own document_keys (rather than
    trusting any key an admin might type) keeps this from becoming a way to
    read arbitrary private objects.
    """
    submission = await session.get(KycSubmission, submission_id)
    if submission is None or key not in submission.document_keys:
        raise AppError(status.HTTP_404_NOT_FOUND, "document_not_found", "Document not found.")
    return uploads.presign_get(key)
