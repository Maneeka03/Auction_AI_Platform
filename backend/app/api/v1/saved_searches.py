import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.saved_search import SavedSearchOut, SaveSearchRequest
from app.services import saved_searches

router = APIRouter(prefix="/saved-searches", tags=["saved-searches"])


@router.post("", response_model=SavedSearchOut, status_code=status.HTTP_201_CREATED)
async def create_saved_search(
    payload: SaveSearchRequest, session: DbSession, actor: CurrentUser
) -> SavedSearchOut:
    return SavedSearchOut.model_validate(await saved_searches.create(session, actor.id, payload))


@router.get("", response_model=list[SavedSearchOut])
async def list_saved_searches(session: DbSession, actor: CurrentUser) -> list[SavedSearchOut]:
    rows = await saved_searches.list_for(session, actor.id)
    return [SavedSearchOut.model_validate(item) for item in rows]


@router.delete("/{search_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_saved_search(
    search_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> None:
    await saved_searches.delete(session, actor.id, search_id)
