import uuid
from collections.abc import Awaitable, Callable
from typing import Annotated, Any

import jwt
from fastapi import Depends, Request, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError, unauthorized
from app.core.rate_limit import is_denied
from app.core.security import decode_jwt
from app.db.session import get_session
from app.models.user import User, UserStatus
from app.rbac.permissions import Access, Module, can
from app.services.auth import ACCESS

bearer = HTTPBearer(auto_error=False)

DbSession = Annotated[AsyncSession, Depends(get_session)]
Credentials = Annotated[HTTPAuthorizationCredentials | None, Depends(bearer)]


async def get_token_payload(credentials: Credentials) -> dict[str, Any]:
    if credentials is None:
        raise unauthorized("Authentication required.")
    try:
        payload = decode_jwt(credentials.credentials, ACCESS)
    except jwt.PyJWTError:
        raise unauthorized("Invalid or expired access token.") from None
    if await is_denied(payload["jti"]):
        raise unauthorized("Invalid or expired access token.")
    return payload


TokenPayload = Annotated[dict[str, Any], Depends(get_token_payload)]


async def get_current_user(payload: TokenPayload, session: DbSession) -> User:
    user = await session.get(User, uuid.UUID(payload["sub"]))
    if user is None or user.status is not UserStatus.ACTIVE:
        raise unauthorized("This account is no longer active.")
    return user


CurrentUser = Annotated[User, Depends(get_current_user)]


def requires(module: Module, level: Access = Access.FULL) -> Callable[..., Awaitable[User]]:
    async def guard(user: CurrentUser) -> User:
        if not can(user.roles, module, level):
            raise AppError(
                status.HTTP_403_FORBIDDEN,
                "forbidden",
                f"Requires {level.name.lower()} access to {module.value}.",
            )
        return user

    return guard


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
