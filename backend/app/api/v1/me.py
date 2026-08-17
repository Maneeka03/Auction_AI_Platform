from fastapi import APIRouter

from app.api.deps import CurrentUser, DbSession
from app.schemas.auction import AuctionOut
from app.schemas.bid import MyBidOut
from app.schemas.property import PropertyOut
from app.services import auctions, properties

router = APIRouter(prefix="/users/me", tags=["me"])


@router.get("/bids", response_model=list[MyBidOut])
async def my_bids(session: DbSession, actor: CurrentUser) -> list[MyBidOut]:
    rows = await auctions.by_bidder(session, actor.id)
    return [MyBidOut.of(row, my_bid, actor.id) for row, my_bid in rows]


@router.get("/auction-invites", response_model=list[AuctionOut])
async def my_auction_invites(session: DbSession, actor: CurrentUser) -> list[AuctionOut]:
    return [AuctionOut.of(*row) for row in await auctions.invited(session, actor.id)]


@router.get("/properties", response_model=list[PropertyOut])
async def my_properties(session: DbSession, actor: CurrentUser) -> list[PropertyOut]:
    return [PropertyOut.of(item) for item in await properties.by_seller(session, actor.id)]
