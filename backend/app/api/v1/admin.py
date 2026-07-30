from fastapi import APIRouter, Depends

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.portal import DocumentVerificationOut
from app.services import portal

router = APIRouter(prefix="/admin", tags=["admin"])

Reviewer = Depends(requires(Module.USER_MANAGEMENT, Access.FULL))


@router.get("/document-verification", response_model=DocumentVerificationOut)
async def document_verification(session: DbSession, _: User = Reviewer) -> DocumentVerificationOut:
    """Combined KYC and escrow verification status across all deals."""
    return await portal.document_verification(session)
