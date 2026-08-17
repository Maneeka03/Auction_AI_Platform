import logging
import uuid

from redis.exceptions import RedisError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import events
from app.models.chat import AuctionChatMessage
from app.models.user import User
from app.schemas.chat import ChatMessageOut
from app.services import auctions

logger = logging.getLogger(__name__)


async def list_for(
    session: AsyncSession, auction_id: uuid.UUID, limit: int
) -> list[AuctionChatMessage]:
    await auctions.get(session, auction_id)
    rows = await session.scalars(
        select(AuctionChatMessage)
        .where(AuctionChatMessage.auction_id == auction_id)
        .order_by(AuctionChatMessage.created_at.desc())
        .limit(limit)
    )
    return list(reversed(list(rows)))


async def post(
    session: AsyncSession, auction_id: uuid.UUID, user: User, body: str
) -> AuctionChatMessage:
    await auctions.get(session, auction_id)
    msg = AuctionChatMessage(auction_id=auction_id, user=user, body=body)
    session.add(msg)
    await session.commit()

    try:
        await events.publish(
            events.auction_channel(auction_id),
            {"type": "chat", "message": ChatMessageOut.of(msg).model_dump(mode="json")},
        )
    except RedisError:
        logger.warning("auction %s: chat broadcast failed", auction_id)
    return msg
