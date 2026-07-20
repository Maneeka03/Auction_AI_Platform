import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
from app.models.lead import LeadStatus
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.crm import BuyerCrmOut, BuyerCrmPage, SellerCrmOut, SellerCrmPage
from app.schemas.lead import CreateLeadRequest, LeadOut, LeadPage, UpdateLeadRequest
from app.services import crm, leads

router = APIRouter(prefix="/crm", tags=["crm"])

BuyerReader = Depends(requires(Module.BUYER_CRM, Access.VIEW))
SellerReader = Depends(requires(Module.SELLER_CRM, Access.VIEW))
LeadReader = Depends(requires(Module.LEAD_MANAGEMENT, Access.VIEW))
LeadManager = Depends(requires(Module.LEAD_MANAGEMENT, Access.FULL))


@router.get("/buyers", response_model=BuyerCrmPage)
async def list_buyers(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=120),
    _: User = BuyerReader,
) -> BuyerCrmPage:
    rows, total = await crm.buyers(session, page, size, search)
    return BuyerCrmPage(
        items=[BuyerCrmOut.of(*row) for row in rows], total=total, page=page, size=size
    )


@router.get("/sellers", response_model=SellerCrmPage)
async def list_sellers(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=120),
    _: User = SellerReader,
) -> SellerCrmPage:
    rows, total = await crm.sellers(session, page, size, search)
    return SellerCrmPage(
        items=[SellerCrmOut.of(*row) for row in rows], total=total, page=page, size=size
    )


@router.post("/leads", response_model=LeadOut, status_code=status.HTTP_201_CREATED)
async def create_lead(
    payload: CreateLeadRequest, session: DbSession, actor: User = LeadManager
) -> LeadOut:
    return LeadOut.model_validate(await leads.create(session, actor, payload))


@router.get("/leads", response_model=LeadPage)
async def list_leads(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    status_filter: LeadStatus | None = Query(None, alias="status"),
    _: User = LeadReader,
) -> LeadPage:
    items, total = await leads.paginate(session, page, size, status_filter)
    return LeadPage(
        items=[LeadOut.model_validate(item) for item in items], total=total, page=page, size=size
    )


@router.get("/leads/{lead_id}", response_model=LeadOut)
async def get_lead(lead_id: uuid.UUID, session: DbSession, _: User = LeadReader) -> LeadOut:
    return LeadOut.model_validate(await leads.get(session, lead_id))


@router.patch("/leads/{lead_id}", response_model=LeadOut)
async def update_lead(
    lead_id: uuid.UUID,
    payload: UpdateLeadRequest,
    session: DbSession,
    _: User = LeadManager,
) -> LeadOut:
    return LeadOut.model_validate(await leads.update(session, lead_id, payload))


@router.delete("/leads/{lead_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_lead(lead_id: uuid.UUID, session: DbSession, _: User = LeadManager) -> None:
    await leads.delete(session, lead_id)
