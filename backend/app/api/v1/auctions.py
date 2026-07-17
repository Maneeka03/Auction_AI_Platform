import asyncio
import uuid

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status

from app.api.deps import DbSession, requires, socket_user
from app.core import events
from app.core.errors import AppError
from app.db.session import SessionFactory
from app.models.auction import AuctionStatus
from app.models.user import User
from app.rbac.permissions import Access, Module, can
from app.schemas.auction import (
    AuctionOut,
    AuctionPage,
    AwardRequest,
    CreateAuctionRequest,
    InviteRequest,
    UpdateAuctionRequest,
)
from app.schemas.bid import BidOut, ParticipantOut, PlaceBidRequest
from app.services import auctions, bids

router = APIRouter(prefix="/auctions", tags=["auctions"])

# Admin and supervisor, in the client's vocabulary: the only roles with full auction management.
Manager = Depends(requires(Module.AUCTION_MANAGEMENT, Access.FULL))
Viewer = Depends(requires(Module.AUCTION_MANAGEMENT, Access.VIEW))
Bidder = Depends(requires(Module.BID_MANAGEMENT, Access.FULL))
BidViewer = Depends(requires(Module.BID_MANAGEMENT, Access.VIEW))


@router.post("", response_model=AuctionOut, status_code=status.HTTP_201_CREATED)
async def create_auction(
    payload: CreateAuctionRequest, session: DbSession, _: User = Manager
) -> AuctionOut:
    auction = await auctions.create(session, payload)
    return AuctionOut.of(*await auctions.detail(session, auction.id))


@router.get("", response_model=AuctionPage)
async def list_auctions(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    status_filter: AuctionStatus | None = Query(None, alias="status"),
    _: User = Viewer,
) -> AuctionPage:
    rows, total = await auctions.paginate(session, page, size, status_filter)
    return AuctionPage(
        items=[AuctionOut.of(*row) for row in rows],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{auction_id}", response_model=AuctionOut)
async def get_auction(auction_id: uuid.UUID, session: DbSession, _: User = Viewer) -> AuctionOut:
    return AuctionOut.of(*await auctions.detail(session, auction_id))


@router.patch("/{auction_id}", response_model=AuctionOut)
async def update_auction(
    auction_id: uuid.UUID,
    payload: UpdateAuctionRequest,
    session: DbSession,
    _: User = Manager,
) -> AuctionOut:
    await auctions.update(session, auction_id, payload)
    return AuctionOut.of(*await auctions.detail(session, auction_id))


@router.delete("/{auction_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_auction(auction_id: uuid.UUID, session: DbSession, _: User = Manager) -> None:
    await auctions.remove(session, auction_id)


@router.post("/{auction_id}/invites", status_code=status.HTTP_204_NO_CONTENT)
async def invite_bidders(
    auction_id: uuid.UUID, payload: InviteRequest, session: DbSession, _: User = Manager
) -> None:
    await auctions.invite(session, auction_id, payload.user_ids)


@router.get("/{auction_id}/participants", response_model=list[ParticipantOut])
async def list_participants(
    auction_id: uuid.UUID, session: DbSession, _: User = Manager
) -> list[ParticipantOut]:
    rows = await auctions.participants(session, auction_id)
    return [ParticipantOut.model_validate(row) for row in rows]


@router.post("/{auction_id}/award", response_model=AuctionOut)
async def award_auction(
    auction_id: uuid.UUID, payload: AwardRequest, session: DbSession, _: User = Manager
) -> AuctionOut:
    await auctions.award(session, auction_id, payload.bidder_id)
    return AuctionOut.of(*await auctions.detail(session, auction_id))


@router.post("/{auction_id}/end", response_model=AuctionOut)
async def end_auction(auction_id: uuid.UUID, session: DbSession, _: User = Manager) -> AuctionOut:
    await auctions.end(session, auction_id)
    return AuctionOut.of(*await auctions.detail(session, auction_id))


@router.post("/{auction_id}/bids", response_model=BidOut, status_code=status.HTTP_201_CREATED)
async def place_bid(
    auction_id: uuid.UUID,
    payload: PlaceBidRequest,
    session: DbSession,
    actor: User = Bidder,
) -> BidOut:
    return BidOut.model_validate(await bids.place(session, actor, auction_id, payload.amount))


@router.get("/{auction_id}/bids", response_model=list[BidOut])
async def list_bids(auction_id: uuid.UUID, session: DbSession, _: User = BidViewer) -> list[BidOut]:
    return [BidOut.model_validate(bid) for bid in await bids.history(session, auction_id)]


async def _relay(websocket: WebSocket, channel: str) -> None:
    async for event in events.subscribe(channel):
        await websocket.send_json(event)


@router.websocket("/{auction_id}/ws")
async def auction_room(websocket: WebSocket, auction_id: uuid.UUID, token: str) -> None:
    """Live auction room: a snapshot on connect, then every change as it happens.

    Messages are {"type": "snapshot" | "bid" | "updated" | "ended", "auction": AuctionOut}. The
    auction is always sent whole, so a client renders the latest message and never merges deltas.
    """
    await websocket.accept()

    # Scoped tightly: an open room must not hold a database connection while it idles.
    async with SessionFactory() as session:
        user = await socket_user(session, token)
        if user is None or not can(user.roles, Module.AUCTION_MANAGEMENT, Access.VIEW):
            await websocket.close(code=4401)
            return
        try:
            snapshot = AuctionOut.of(*await auctions.detail(session, auction_id))
        except AppError:
            await websocket.close(code=4404)
            return

    await websocket.send_json({"type": "snapshot", "auction": snapshot.model_dump(mode="json")})
    relay = asyncio.create_task(_relay(websocket, events.auction_channel(auction_id)))
    try:
        # The client sends nothing; this exists purely to notice the socket closing.
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        relay.cancel()
