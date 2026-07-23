import uuid
from datetime import UTC, datetime

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.campaign import Campaign, CampaignStatus
from app.schemas.campaign import CreateCampaignRequest, UpdateCampaignRequest


async def create(session: AsyncSession, data: CreateCampaignRequest) -> Campaign:
    campaign = Campaign(**data.model_dump())
    session.add(campaign)
    await session.commit()
    await session.refresh(campaign)
    return campaign


async def get(session: AsyncSession, campaign_id: uuid.UUID) -> Campaign:
    campaign = await session.get(Campaign, campaign_id)
    if campaign is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "campaign_not_found", "Campaign not found.")
    return campaign


async def paginate(
    session: AsyncSession, page: int, size: int, campaign_status: CampaignStatus | None
) -> tuple[list[Campaign], int]:
    query = select(Campaign)
    if campaign_status:
        query = query.where(Campaign.status == campaign_status)

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(Campaign.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


async def update(
    session: AsyncSession, campaign_id: uuid.UUID, data: UpdateCampaignRequest
) -> Campaign:
    campaign = await get(session, campaign_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(campaign, field, value)
    await session.commit()
    await session.refresh(campaign)
    return campaign


async def send(session: AsyncSession, campaign_id: uuid.UUID) -> Campaign:
    """Mark a campaign as sent. Delivery to the channel itself is out of this service's scope."""
    campaign = await get(session, campaign_id)
    if campaign.status is CampaignStatus.SENT:
        raise AppError(
            status.HTTP_409_CONFLICT, "already_sent", "This campaign has already been sent."
        )

    campaign.status = CampaignStatus.SENT
    campaign.sent_at = datetime.now(UTC)
    await session.commit()
    await session.refresh(campaign)
    return campaign


async def delete(session: AsyncSession, campaign_id: uuid.UUID) -> None:
    campaign = await get(session, campaign_id)
    await session.delete(campaign)
    await session.commit()