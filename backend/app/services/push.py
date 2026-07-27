import asyncio
import json
import logging
import uuid

from pywebpush import WebPushException, webpush
from sqlalchemy import delete, select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.db.session import SessionFactory
from app.models.push import PushSubscription
from app.schemas.push import PushSubscriptionIn

logger = logging.getLogger(__name__)

# Endpoints reply with these once a subscription is dead; anything else is treated as transient.
GONE = frozenset({404, 410})


async def subscribe(session: AsyncSession, user_id: uuid.UUID, data: PushSubscriptionIn) -> None:
    """Store a device's push subscription, re-homing the endpoint if it already exists."""
    await session.execute(
        pg_insert(PushSubscription)
        .values(
            user_id=user_id, endpoint=data.endpoint, p256dh=data.keys.p256dh, auth=data.keys.auth
        )
        .on_conflict_do_update(
            index_elements=["endpoint"],
            set_={"user_id": user_id, "p256dh": data.keys.p256dh, "auth": data.keys.auth},
        )
    )
    await session.commit()


async def unsubscribe(session: AsyncSession, endpoint: str) -> None:
    await session.execute(delete(PushSubscription).where(PushSubscription.endpoint == endpoint))
    await session.commit()


async def dispatch(user_id: uuid.UUID, title: str, body: str, url: str | None = None) -> None:
    """Push a notification to every device a user has registered. Best-effort; prunes dead ones."""
    if not settings.vapid_private_key:
        return
    try:
        async with SessionFactory() as session:
            subs = list(
                await session.scalars(
                    select(PushSubscription).where(PushSubscription.user_id == user_id)
                )
            )
        payload = json.dumps({"title": title, "body": body, "url": url})
        dead = [sub.endpoint for sub in subs if not await _send(sub, payload)]
        if dead:
            async with SessionFactory() as session:
                await session.execute(
                    delete(PushSubscription).where(PushSubscription.endpoint.in_(dead))
                )
                await session.commit()
    except Exception:
        logger.exception("push dispatch failed for user %s", user_id)


async def _send(sub: PushSubscription, payload: str) -> bool:
    """Send to one device. Returns False only when the endpoint is gone and should be removed."""
    try:
        await asyncio.to_thread(
            webpush,
            subscription_info={
                "endpoint": sub.endpoint,
                "keys": {"p256dh": sub.p256dh, "auth": sub.auth},
            },
            data=payload,
            vapid_private_key=settings.vapid_private_key,
            vapid_claims={"sub": settings.vapid_subject},
        )
        return True
    except WebPushException as exc:
        code = exc.response.status_code if exc.response is not None else None
        return code not in GONE
    except Exception:
        logger.exception("web push send failed")
        return True
