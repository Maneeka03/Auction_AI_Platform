import uuid

from fastapi import APIRouter, Depends, Query, Response, status

from app.api.deps import CurrentUser, DbSession, requires
from app.models.kyc import KycStatus
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.kyc import KycOut, KycPage, KycReviewOut, ReviewKycRequest, SubmitKycRequest
from app.services import kyc

router = APIRouter(tags=["kyc"])

# Reviewing identity is a back-office job, gated on the same module as the rest of user admin.
Reviewer = Depends(requires(Module.USER_MANAGEMENT, Access.FULL))


@router.post("/kyc", response_model=KycOut, status_code=status.HTTP_201_CREATED)
async def submit_kyc(payload: SubmitKycRequest, session: DbSession, actor: CurrentUser) -> KycOut:
    submission = await kyc.submit(session, actor, payload.legal_name, payload.document_keys)
    return KycOut.model_validate(submission)


@router.get("/kyc/me", response_model=KycOut | None)
async def my_kyc(session: DbSession, actor: CurrentUser, response: Response) -> KycOut | None:
    submission = await kyc.mine(session, actor.id)
    if submission is None:
        # Never submitted is a normal state, not an error - the client shows the empty form.
        response.status_code = status.HTTP_204_NO_CONTENT
        return None
    return KycOut.model_validate(submission)


@router.get("/admin/kyc", response_model=KycPage)
async def list_kyc(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    status_filter: KycStatus | None = Query(None, alias="status"),
    _: User = Reviewer,
) -> KycPage:
    items, total = await kyc.paginate(session, page, size, status_filter)
    return KycPage(
        items=[KycReviewOut.of(item) for item in items], total=total, page=page, size=size
    )


@router.patch("/admin/kyc/{submission_id}", response_model=KycOut)
async def review_kyc(
    submission_id: uuid.UUID,
    payload: ReviewKycRequest,
    session: DbSession,
    actor: User = Reviewer,
) -> KycOut:
    submission = await kyc.review(session, actor, submission_id, payload.approved, payload.notes)
    return KycOut.model_validate(submission)
