import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.property import PropertyOut
from app.schemas.watchlist import WatchlistRequest
from app.services import watchlist

router = APIRouter(prefix="/watchlist", tags=["watchlist"])


@router.post("", status_code=status.HTTP_204_NO_CONTENT)
async def save_property(
    payload: WatchlistRequest, session: DbSession, actor: CurrentUser
) -> None:
    await watchlist.add(session, actor.id, payload.property_id)


@router.get("", response_model=list[PropertyOut])
async def my_watchlist(session: DbSession, actor: CurrentUser) -> list[PropertyOut]:
    return [PropertyOut.of(item) for item in await watchlist.list_for(session, actor.id)]


@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_property(
    property_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> None:
    await watchlist.remove(session, actor.id, property_id)
