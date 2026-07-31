import uuid
from datetime import datetime, timezone

from fastapi import status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.auction_request import AuctionRequest, AuctionRequestStatus
from app.models.user import User
from app.schemas.auction_request import CreateAuctionRequestPayload, ReviewAuctionRequestPayload


async def create(
    session: AsyncSession, seller: User, data: CreateAuctionRequestPayload
) -> AuctionRequest:
    req = AuctionRequest(
        seller_id=seller.id,
        title=data.title,
        description=data.description,
        requested_at=data.requested_at,
        property_id=data.property_id,
        opening_bid=data.opening_bid,
        reserve_price=data.reserve_price,
        ends_at=data.ends_at,
        increments=data.increments,
        status=AuctionRequestStatus.PENDING,
    )
    session.add(req)
    await session.commit()
    await session.refresh(req)
    return req


async def list_for_seller(
    session: AsyncSession, seller_id: uuid.UUID
) -> list[AuctionRequest]:
    result = await session.execute(
        select(AuctionRequest)
        .where(AuctionRequest.seller_id == seller_id)
        .order_by(AuctionRequest.created_at.desc())
    )
    return list(result.scalars().all())


async def list_all(
    session: AsyncSession,
    filter_status: AuctionRequestStatus | None = None,
) -> list[AuctionRequest]:
    query = select(AuctionRequest).order_by(AuctionRequest.created_at.desc())
    if filter_status:
        query = query.where(AuctionRequest.status == filter_status)
    result = await session.execute(query)
    return list(result.scalars().all())


async def get(session: AsyncSession, request_id: uuid.UUID) -> AuctionRequest:
    req = await session.get(AuctionRequest, request_id)
    if req is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "not_found", "Auction request not found.")
    return req


async def review(
    session: AsyncSession,
    request_id: uuid.UUID,
    reviewer: User,
    data: ReviewAuctionRequestPayload,
) -> AuctionRequest:
    from app.models.auction import Auction
    from app.schemas.auction import CreateAuctionRequest
    from app.services import auctions as auction_svc

    req = await get(session, request_id)
    if req.status != AuctionRequestStatus.PENDING:
        raise AppError(status.HTTP_409_CONFLICT, "already_reviewed", "Request already reviewed.")

    req.status = AuctionRequestStatus(data.status)
    req.admin_note = data.admin_note
    req.reviewed_by = reviewer.id
    req.reviewed_at = datetime.now(tz=timezone.utc)

    # Auto-create the auction when approved and the seller provided all required auction details.
    if (
        data.status == AuctionRequestStatus.APPROVED
        and req.property_id is not None
        and req.opening_bid is not None
        and req.reserve_price is not None
        and req.ends_at is not None
        and req.increments is not None
    ):
        from datetime import timezone as _tz

        starts = req.requested_at
        if starts.tzinfo is None:
            starts = starts.replace(tzinfo=_tz.utc)
        ends = req.ends_at
        if ends.tzinfo is None:
            ends = ends.replace(tzinfo=_tz.utc)

        auction_payload = CreateAuctionRequest(
            property_id=req.property_id,
            starts_at=starts,
            ends_at=ends,
            opening_bid=req.opening_bid,
            reserve_price=req.reserve_price,
            increments=req.increments,
        )
        try:
            auction = await auction_svc.create(session, auction_payload)
            req.auction_id = auction.id
        except AppError:
            # If the property isn't published yet or another constraint fails, approve the request
            # anyway so the admin can still manually create the auction later.
            pass

    await session.commit()
    await session.refresh(req)
    return req
