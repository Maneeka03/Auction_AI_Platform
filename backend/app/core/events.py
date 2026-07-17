import json
import uuid
from collections.abc import AsyncIterator
from typing import Any

from app.core.redis import redis


def auction_channel(auction_id: uuid.UUID) -> str:
    return f"auction:{auction_id}"


async def publish(channel: str, payload: dict[str, Any]) -> None:
    await redis.publish(channel, json.dumps(payload))


async def subscribe(channel: str) -> AsyncIterator[dict[str, Any]]:
    """Yield every message published to a channel until the caller stops listening.

    Each subscriber gets its own pubsub connection, so one slow client cannot stall the others.
    """
    pubsub = redis.pubsub()
    await pubsub.subscribe(channel)
    try:
        async for message in pubsub.listen():
            if message["type"] == "message":
                yield json.loads(message["data"])
    finally:
        await pubsub.aclose()
