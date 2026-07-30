import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.watchlist import WatchlistItemOut, WatchlistRequest, WatchlistStatusUpdate
from app.services import properties, watchlist

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def save_property(payload: WatchlistRequest, session: DbSession, actor: CurrentUser) -> None:
    await watchlist.add(session, actor.id, payload.property_id)


@router.get("", response_model=list[WatchlistItemOut])
async def my_watchlist(session: DbSession, actor: CurrentUser) -> list[WatchlistItemOut]:
    rows = await watchlist.list_for(session, actor.id)
    return [WatchlistItemOut.of(item, listing) for item, listing in rows]


@router.patch("/{property_id}", response_model=WatchlistItemOut)
async def update_watchlist_status(
    property_id: uuid.UUID,
    payload: WatchlistStatusUpdate,
    session: DbSession,
    actor: CurrentUser,
) -> WatchlistItemOut:
    item = await watchlist.update_status(session, actor.id, property_id, payload.status)
    return WatchlistItemOut.of(item, await properties.get(session, property_id))


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_property(property_id: uuid.UUID, session: DbSession, actor: CurrentUser) -> None:
    await watchlist.remove(session, actor.id, property_id)
