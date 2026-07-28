import logging
import uuid

from redis.exceptions import RedisError
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import events
from app.models.comment import AuctionComment
from app.models.user import User
from app.schemas.comment import CommentOut
from app.services import auctions

logger = logging.getLogger(__name__)


async def list_for(
    session: AsyncSession, auction_id: uuid.UUID, limit: int
) -> list[AuctionComment]:
    """The most recent messages in an auction room, oldest first for a chat feed."""
    await auctions.get(session, auction_id)  # 404s on an unknown auction
    rows = await session.scalars(
        select(AuctionComment)
        .where(AuctionComment.auction_id == auction_id)
        .order_by(AuctionComment.created_at.desc())
        .limit(limit)
    )
    return list(reversed(list(rows)))


async def post(
    session: AsyncSession, auction_id: uuid.UUID, user: User, body: str
) -> AuctionComment:
    await auctions.get(session, auction_id)
    # Assigned by object so the author is loaded for serialising, without a second query.
    comment = AuctionComment(auction_id=auction_id, user=user, body=body)
    session.add(comment)
    await session.commit()

    # Push the new message to everyone in the room. Best-effort: a missed push re-syncs on reload.
    try:
        await events.publish(
            events.auction_channel(auction_id),
            {"type": "comment", "comment": CommentOut.of(comment).model_dump(mode="json")},
        )
    except RedisError:
        logger.warning("auction %s: comment broadcast failed", auction_id)
    return comment
