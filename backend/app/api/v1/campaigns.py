import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
from app.models.campaign import CampaignStatus
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.campaign import (
    CampaignOut,
    CampaignPage,
    CreateCampaignRequest,
    UpdateCampaignRequest,
)
from app.services import campaigns

router = APIRouter(prefix="/campaigns", tags=["campaigns"])

Reader = Depends(requires(Module.MARKETING_CAMPAIGNS, Access.VIEW))
Manager = Depends(requires(Module.MARKETING_CAMPAIGNS, Access.FULL))


@router.post("", response_model=CampaignOut, status_code=status.HTTP_201_CREATED)
async def create_campaign(
    payload: CreateCampaignRequest, session: DbSession, _: User = Manager
) -> CampaignOut:
    return CampaignOut.model_validate(await campaigns.create(session, payload))


@router.get("", response_model=CampaignPage)
async def list_campaigns(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    status_filter: CampaignStatus | None = Query(None, alias="status"),
    _: User = Reader,
) -> CampaignPage:
    items, total = await campaigns.paginate(session, page, size, status_filter)
    return CampaignPage(
        items=[CampaignOut.model_validate(item) for item in items],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{campaign_id}", response_model=CampaignOut)
async def get_campaign(campaign_id: uuid.UUID, session: DbSession, _: User = Reader) -> CampaignOut:
    return CampaignOut.model_validate(await campaigns.get(session, campaign_id))


@router.patch("/{campaign_id}", response_model=CampaignOut)
async def update_campaign(
    campaign_id: uuid.UUID,
    payload: UpdateCampaignRequest,
    session: DbSession,
    _: User = Manager,
) -> CampaignOut:
    return CampaignOut.model_validate(await campaigns.update(session, campaign_id, payload))


@router.post("/{campaign_id}/send", response_model=CampaignOut)
async def send_campaign(
    campaign_id: uuid.UUID, session: DbSession, _: User = Manager
) -> CampaignOut:
    return CampaignOut.model_validate(await campaigns.send(session, campaign_id))


@router.delete("/{campaign_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_campaign(campaign_id: uuid.UUID, session: DbSession, _: User = Manager) -> None:
    await campaigns.delete(session, campaign_id)
