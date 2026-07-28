from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.schemas.push import PushSubscriptionIn, UnsubscribeIn, VapidKeyOut
from app.services import push

router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-key", response_model=VapidKeyOut)
async def vapid_key(_: CurrentUser) -> VapidKeyOut:
    """The public VAPID key the browser needs to create a push subscription."""
    return VapidKeyOut(public_key=settings.vapid_public_key)


@router.post("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
async def subscribe(payload: PushSubscriptionIn, session: DbSession, actor: CurrentUser) -> None:
    await push.subscribe(session, actor.id, payload)


@router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(payload: UnsubscribeIn, session: DbSession, _: CurrentUser) -> None:
    await push.unsubscribe(session, payload.endpoint)
