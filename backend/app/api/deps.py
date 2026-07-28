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
from app.rbac.permissions import Access, Module, Role, can
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


async def socket_user(session: AsyncSession, token: str) -> User | None:
    """Authenticate a WebSocket from its query-string token.

    Browsers cannot set an Authorization header on a WebSocket handshake, so the access token
    arrives as a query parameter. The checks are the same as the HTTP path; only the way failure is
    reported differs - a socket gets a close code, not a JSON body.
    """
    try:
        payload = decode_jwt(token, ACCESS)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        return None
    if await is_denied(payload["jti"]):
        return None

    user = await session.get(User, user_id)
    return user if user is not None and user.status is UserStatus.ACTIVE else None


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


# Sentinel UUID that can never match a real tenant — used so unassigned users see nothing.
_NO_TENANT = uuid.UUID(int=0)


def effective_tenant_id(actor: User) -> uuid.UUID | None:
    """Returns the tenant filter to apply to all data queries.

    - super_admin       → their own id (they ARE the tenant root)
    - agency_admin      → None (no operational data access via RBAC)
    - staff/buyer/seller with tenant_id → that tenant_id
    - staff/buyer/seller with NO tenant_id → zero UUID (matches nothing → empty results)
    """
    if Role.SUPER_ADMIN in actor.roles:
        return actor.id
    if Role.AGENCY_ADMIN in actor.roles:
        return None  # RBAC already blocks operational endpoints for agency_admin
    return actor.tenant_id if actor.tenant_id is not None else _NO_TENANT


def client_ip(request: Request) -> str:
    forwarded = request.headers.get("x-forwarded-for")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"
