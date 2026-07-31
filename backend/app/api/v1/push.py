# from fastapi import APIRouter, status

# from app.api.deps import CurrentUser, DbSession
# from app.core.config import settings
# from app.schemas.push import PushSubscriptionIn, UnsubscribeIn, VapidKeyOut
# from app.services import push

# router = APIRouter(prefix="/push", tags=["push"])


# @router.get("/vapid-key", response_model=VapidKeyOut)
# async def vapid_key(_: CurrentUser) -> VapidKeyOut:
#     """The public VAPID key the browser needs to create a push subscription."""
#     return VapidKeyOut(public_key=settings.vapid_public_key)


# # @router.post("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
# # async def subscribe(payload: PushSubscriptionIn, session: DbSession, actor: CurrentUser) -> None:
# #     await push.subscribe(session, actor.id, payload)
# @router.post('/subscribe', status_code=status.HTTP_204_NO_CONTENT)
# async def subscribe(payload: PushSubscriptionIn, session: DbSession) -> None:
#     import uuid

#     TEST_USER_ID = uuid.UUID('dddfd7c7-7f28-4641-b9a6-d17f75779ee1')

#     await push.subscribe(session, TEST_USER_ID, payload)

# @router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
# async def unsubscribe(payload: UnsubscribeIn, session: DbSession, _: CurrentUser) -> None:
#     await push.unsubscribe(session, payload.endpoint)




from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.core.config import settings
from app.schemas.push import PushSubscriptionIn, UnsubscribeIn, VapidKeyOut
from app.services import push


router = APIRouter(prefix="/push", tags=["push"])


@router.get("/vapid-key", response_model=VapidKeyOut)
async def vapid_key(_: CurrentUser) -> VapidKeyOut:
    """
    Return public VAPID key required by browser push subscription.
    """
    return VapidKeyOut(
        public_key=settings.vapid_public_key
    )


@router.post("/subscribe", status_code=status.HTTP_204_NO_CONTENT)
async def subscribe(
    payload: PushSubscriptionIn,
    session: DbSession,
    actor: CurrentUser
) -> None:
    """
    Save browser push subscription for logged-in user.
    """
    await push.subscribe(
        session,
        actor.id,
        payload
    )


@router.post("/unsubscribe", status_code=status.HTTP_204_NO_CONTENT)
async def unsubscribe(
    payload: UnsubscribeIn,
    session: DbSession,
    actor: CurrentUser
) -> None:
    """
    Remove user's push subscription.
    """
    await push.unsubscribe(
        session,
        payload.endpoint
    )