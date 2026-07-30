import uuid

from fastapi import APIRouter, Query, status

from app.api.deps import CurrentUser, DbSession
from app.core.errors import AppError
from app.models.property import Property, PropertyStatus
from app.models.user import User
from app.rbac.permissions import Role
from app.schemas.auction import AuctionOut, UpdateAuctionRequest
from app.schemas.bid import ParticipantOut
from app.schemas.portal import (
    AuctionAnalysisOut,
    ReservePriceUpdate,
    SellerDashboardOut,
    SellerEscrowOut,
)
from app.schemas.property import CreatePropertyRequest, PropertyOut, UpdatePropertyRequest
from app.services import auctions, bids, escrow, portal, properties

router = APIRouter(prefix="/seller", tags=["seller-portal"])


async def _own_listing(
    session: DbSession, actor: User, property_id: uuid.UUID, require_draft: bool = False
) -> Property:
    listing = await properties.get(session, property_id)
    if listing.seller_id != actor.id:
        raise AppError(status.HTTP_404_NOT_FOUND, "property_not_found", "Property not found.")
    if require_draft and listing.status is not PropertyStatus.DRAFT:
        raise AppError(
            status.HTTP_409_CONFLICT,
            "not_editable",
            "A listing can only be edited before approval.",
        )
    return listing


@router.get("/dashboard", response_model=SellerDashboardOut)
async def seller_dashboard(session: DbSession, actor: CurrentUser) -> SellerDashboardOut:
    return await portal.seller_dashboard(session, actor.id)


@router.post("/listings", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
async def create_listing(
    payload: CreatePropertyRequest, session: DbSession, actor: CurrentUser
) -> PropertyOut:
    if Role.SELLER not in actor.roles:
        raise AppError(status.HTTP_403_FORBIDDEN, "forbidden", "Only sellers can submit listings.")
    return PropertyOut.of(await properties.create(session, actor, payload))


@router.get("/listings", response_model=list[PropertyOut])
async def my_listings(
    session: DbSession,
    actor: CurrentUser,
    status_filter: PropertyStatus | None = Query(None, alias="status"),
) -> list[PropertyOut]:
    if status_filter:
        items = await properties.by_seller_status(session, actor.id, status_filter)
    else:
        items = await properties.by_seller(session, actor.id)
    return [PropertyOut.of(item) for item in items]


@router.get("/listings/{property_id}", response_model=PropertyOut)
async def get_listing(
    property_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> PropertyOut:
    return PropertyOut.of(await _own_listing(session, actor, property_id))


@router.patch("/listings/{property_id}", response_model=PropertyOut)
async def update_listing(
    property_id: uuid.UUID,
    payload: UpdatePropertyRequest,
    session: DbSession,
    actor: CurrentUser,
) -> PropertyOut:
    await _own_listing(session, actor, property_id, require_draft=True)
    payload.status = None  # The sign-off panel publishes; a seller never sets status directly.
    return PropertyOut.of(await properties.update(session, property_id, payload))


@router.get("/auctions", response_model=list[AuctionOut])
async def my_auctions(session: DbSession, actor: CurrentUser) -> list[AuctionOut]:
    return [AuctionOut.of(*row) for row in await auctions.by_seller(session, actor.id)]


@router.patch("/auctions/{auction_id}/reserve-price", response_model=AuctionOut)
async def update_reserve_price(
    auction_id: uuid.UUID,
    payload: ReservePriceUpdate,
    session: DbSession,
    actor: CurrentUser,
) -> AuctionOut:
    auction, _, _ = await auctions.detail(session, auction_id)
    if auction.listing.seller_id != actor.id:
        raise AppError(status.HTTP_404_NOT_FOUND, "auction_not_found", "Auction not found.")
    await auctions.update(
        session, auction_id, UpdateAuctionRequest(reserve_price=payload.reserve_price)
    )
    return AuctionOut.of(*await auctions.detail(session, auction_id))


@router.get("/auctions/{auction_id}/analysis", response_model=AuctionAnalysisOut)
async def auction_analysis(
    auction_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> AuctionAnalysisOut:
    auction, current_bid, bidder_count = await auctions.detail(session, auction_id)
    if auction.listing.seller_id != actor.id:
        raise AppError(status.HTTP_404_NOT_FOUND, "auction_not_found", "Auction not found.")
    seats = await auctions.participants(session, auction_id)
    bid_rows = await bids.history(session, auction_id)
    return AuctionAnalysisOut(
        auction_id=auction.id,
        title=auction.listing.title,
        reserve_price=auction.reserve_price,
        winning_bid=current_bid,
        reserve_met=current_bid is not None and current_bid >= auction.reserve_price,
        total_bids=len(bid_rows),
        bidder_count=bidder_count,
        participants=[ParticipantOut.model_validate(seat) for seat in seats],
    )


@router.get("/sales", response_model=list[PropertyOut])
async def my_sales(session: DbSession, actor: CurrentUser) -> list[PropertyOut]:
    items = await properties.by_seller_status(session, actor.id, PropertyStatus.SOLD)
    return [PropertyOut.of(item) for item in items]


@router.get("/escrow", response_model=list[SellerEscrowOut])
async def my_escrow(session: DbSession, actor: CurrentUser) -> list[SellerEscrowOut]:
    return [SellerEscrowOut.of(item) for item in await escrow.for_seller(session, actor.id)]
