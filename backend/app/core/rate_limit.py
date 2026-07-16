import time
from typing import Final

from fastapi import status

from app.core.config import settings
from app.core.errors import AppError
from app.core.redis import redis

_FAILURES: Final = "auth:failures:{}"
_THROTTLE: Final = "auth:throttle:{}"
_DENYLIST: Final = "auth:denylist:{}"


async def throttle(identifier: str, limit: int, window: int) -> None:
    key = _THROTTLE.format(identifier)
    hits = await redis.incr(key)
    if hits == 1:
        await redis.expire(key, window)
    if hits > limit:
        raise AppError(
            status.HTTP_429_TOO_MANY_REQUESTS,
            "rate_limited",
            "Too many requests. Please try again later.",
        )


async def assert_not_locked(email: str) -> None:
    failures = await redis.get(_FAILURES.format(email))
    if failures and int(failures) >= settings.login_max_failures:
        raise AppError(
            status.HTTP_423_LOCKED,
            "account_locked",
            "Account temporarily locked after repeated failed sign-ins.",
        )


async def record_failure(email: str) -> None:
    key = _FAILURES.format(email)
    if await redis.incr(key) == 1:
        await redis.expire(key, settings.login_lockout_ttl)


async def clear_failures(email: str) -> None:
    await redis.delete(_FAILURES.format(email))


async def deny_token(jti: str, expires_at: int) -> None:
    ttl = expires_at - int(time.time())
    if ttl > 0:
        await redis.set(_DENYLIST.format(jti), "1", ex=ttl)


async def is_denied(jti: str) -> bool:
    return bool(await redis.exists(_DENYLIST.format(jti)))
