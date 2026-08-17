import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DbSession, requires
from app.core.errors import AppError
from app.models.auction_request import AuctionRequestStatus
from app.models.user import User
from app.rbac.permissions import Access, Module, Role
from app.schemas.auction_request import (
    AuctionRequestOut,
    CreateAuctionRequestPayload,
    ReviewAuctionRequestPayload,
)
from app.services import auction_requests

router = APIRouter(tags=["auction-requests"])

AdminReviewer = Depends(requires(Module.AUCTION_MANAGEMENT, Access.FULL))


@router.post(
    "/seller/auction-requests",
    response_model=AuctionRequestOut,
    status_code=status.HTTP_201_CREATED,
)
async def submit_auction_request(
    payload: CreateAuctionRequestPayload,
    session: DbSession,
    actor: CurrentUser,
) -> AuctionRequestOut:
    if Role.SELLER not in actor.roles:
        raise AppError(status.HTTP_403_FORBIDDEN, "forbidden", "Only sellers can submit auction requests.")
    req = await auction_requests.create(session, actor, payload)
    return AuctionRequestOut.of(req)


@router.get("/seller/auction-requests", response_model=list[AuctionRequestOut])
async def list_my_auction_requests(
    session: DbSession,
    actor: CurrentUser,
) -> list[AuctionRequestOut]:
    if Role.SELLER not in actor.roles:
        raise AppError(status.HTTP_403_FORBIDDEN, "forbidden", "Only sellers can access this.")
    reqs = await auction_requests.list_for_seller(session, actor.id)
    return [AuctionRequestOut.of(r) for r in reqs]


@router.get("/admin/auction-requests", response_model=list[AuctionRequestOut])
async def list_all_auction_requests(
    session: DbSession,
    _actor: User = AdminReviewer,
    filter_status: AuctionRequestStatus | None = Query(default=None),
) -> list[AuctionRequestOut]:
    reqs = await auction_requests.list_all(session, filter_status)
    return [AuctionRequestOut.of(r) for r in reqs]


@router.patch("/admin/auction-requests/{request_id}", response_model=AuctionRequestOut)
async def review_auction_request(
    request_id: uuid.UUID,
    payload: ReviewAuctionRequestPayload,
    session: DbSession,
    actor: User = AdminReviewer,
) -> AuctionRequestOut:
    req = await auction_requests.review(session, request_id, actor, payload)
    return AuctionRequestOut.of(req)
