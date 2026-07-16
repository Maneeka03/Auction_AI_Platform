from redis.asyncio import Redis

from app.core.config import settings

redis: Redis = Redis.from_url(str(settings.redis_url), decode_responses=True)
