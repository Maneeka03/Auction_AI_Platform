import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.faq import CreateFAQRequest, FAQOut, FAQPage, UpdateFAQRequest
from app.services import faqs

router = APIRouter(prefix="/faqs", tags=["faqs"])

Manager = Depends(requires(Module.SYSTEM_SETTINGS, Access.FULL))
Viewer = Depends(requires(Module.SYSTEM_SETTINGS, Access.VIEW))


@router.get("/public", response_model=FAQPage)
async def list_public_faqs(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
) -> FAQPage:
    """Published FAQs only, no auth required — powers the public Help & FAQ page."""
    rows, total = await faqs.paginate(session, page, size, published_only=True)
    return FAQPage(items=[FAQOut.of(row) for row in rows], total=total, page=page, size=size)


@router.get("", response_model=FAQPage)
async def list_faqs(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    _: User = Viewer,
) -> FAQPage:
    """Every FAQ, published or not — for the admin management page."""
    rows, total = await faqs.paginate(session, page, size, published_only=False)
    return FAQPage(items=[FAQOut.of(row) for row in rows], total=total, page=page, size=size)


@router.post("", response_model=FAQOut, status_code=status.HTTP_201_CREATED)
async def create_faq(payload: CreateFAQRequest, session: DbSession, _: User = Manager) -> FAQOut:
    return FAQOut.of(await faqs.create(session, payload))


@router.patch("/{faq_id}", response_model=FAQOut)
async def update_faq(
    faq_id: uuid.UUID, payload: UpdateFAQRequest, session: DbSession, _: User = Manager
) -> FAQOut:
    return FAQOut.of(await faqs.update(session, faq_id, payload))


@router.delete("/{faq_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_faq(faq_id: uuid.UUID, session: DbSession, _: User = Manager) -> None:
    await faqs.remove(session, faq_id)