import uuid
from datetime import UTC, datetime, timedelta

import jwt
from fastapi import status
from sqlalchemy import select, update
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession

from app.core import rate_limit
from app.core.config import settings
from app.core.errors import AppError, unauthorized
from app.core.security import (
    create_jwt,
    decode_jwt,
    hash_password,
    needs_rehash,
    new_refresh_token,
    password_fingerprint,
    sha256,
    verify_password,
)
from app.models.user import AuthProvider, RefreshToken, User, UserRole, UserStatus
from app.rbac.permissions import SELF_SERVICE_ROLES, Role
from app.schemas.auth import RegisterRequest
from app.services import mail

ACCESS = "access"
VERIFY_EMAIL = "verify_email"
RESET_PASSWORD = "reset_password"

_DUMMY_HASH = hash_password(uuid.uuid4().hex)


def _invalid_link() -> AppError:
    return AppError(
        status.HTTP_400_BAD_REQUEST, "invalid_token", "This link is invalid or has expired."
    )


async def get_by_email(session: AsyncSession, email: str) -> User | None:
    return await session.scalar(select(User).where(User.email == email))


async def register(session: AsyncSession, data: RegisterRequest) -> User:
    user = User(
        email=data.email,
        password_hash=hash_password(data.password),
        full_name=data.full_name,
        country=data.country,
        business_type=data.business_type,
        role_rows=[UserRole(role=data.role)],
    )
    session.add(user)
    try:
        await session.commit()
    except IntegrityError:
        await session.rollback()
        raise AppError(
            status.HTTP_409_CONFLICT, "email_taken", "This email is already registered."
        ) from None

    await send_verification(user)
    return user


async def enroll_seller(session: AsyncSession, user: User, business_type: str | None) -> User:
    if not SELF_SERVICE_ROLES.intersection(user.roles):
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "forbidden",
            "Only registered buyers can enrol as sellers.",
        )
    if Role.SELLER not in user.roles:
        user.role_rows.append(UserRole(role=Role.SELLER))
    user.business_type = business_type or user.business_type
    await session.commit()
    return user


async def send_verification(user: User) -> None:
    token = create_jwt(str(user.id), VERIFY_EMAIL, settings.verify_token_ttl)
    await mail.send(
        user.email,
        "Verify your Provenix account",
        f"{settings.app_url}/verify-email?token={token}",
    )


async def send_password_link(user: User, subject: str, path: str) -> None:
    token = create_jwt(
        str(user.id),
        RESET_PASSWORD,
        settings.reset_token_ttl,
        fp=password_fingerprint(user.password_hash),
    )
    await mail.send(user.email, subject, f"{settings.app_url}/{path}?token={token}")


async def resend_verification(session: AsyncSession, email: str) -> None:
    user = await get_by_email(session, email)
    if user and user.status is UserStatus.PENDING_VERIFICATION and user.email_verified_at is None:
        await send_verification(user)


async def verify_email(session: AsyncSession, token: str) -> None:
    user, _ = await _decode_subject(session, token, VERIFY_EMAIL)
    if user.email_verified_at is None:
        user.email_verified_at = datetime.now(UTC)
    if user.status is UserStatus.PENDING_VERIFICATION:
        user.status = UserStatus.ACTIVE
    await session.commit()


async def forgot_password(session: AsyncSession, email: str) -> None:
    user = await get_by_email(session, email)
    if user and user.auth_provider is AuthProvider.LOCAL and user.status is not UserStatus.DELETED:
        await send_password_link(user, "Reset your Provenix password", "reset-password")


async def reset_password(session: AsyncSession, token: str, password: str) -> None:
    user, payload = await _decode_subject(session, token, RESET_PASSWORD)
    if payload.get("fp") != password_fingerprint(user.password_hash):
        raise _invalid_link()

    user.password_hash = hash_password(password)
    user.email_verified_at = user.email_verified_at or datetime.now(UTC)
    if user.status is UserStatus.PENDING_VERIFICATION:
        user.status = UserStatus.ACTIVE
    await revoke_all(session, user.id)
    await rate_limit.clear_failures(user.email)
    await session.commit()


async def change_password(
    session: AsyncSession, user: User, current_password: str, new_password: str
) -> None:
    if user.password_hash is None or not verify_password(current_password, user.password_hash):
        raise AppError(
            status.HTTP_400_BAD_REQUEST, "invalid_password", "Current password is incorrect."
        )
    user.password_hash = hash_password(new_password)
    await revoke_all(session, user.id)
    await session.commit()


async def authenticate(session: AsyncSession, email: str, password: str) -> User:
    await rate_limit.assert_not_locked(email)
    user = await get_by_email(session, email)

    if user is None or user.auth_provider is not AuthProvider.LOCAL or user.password_hash is None:
        verify_password(password, _DUMMY_HASH)
        await rate_limit.record_failure(email)
        raise unauthorized("Incorrect email or password.")

    if not verify_password(password, user.password_hash):
        await rate_limit.record_failure(email)
        raise unauthorized("Incorrect email or password.")

    if user.status is UserStatus.PENDING_VERIFICATION:
        raise AppError(
            status.HTTP_403_FORBIDDEN,
            "email_not_verified",
            "Confirm your email address before signing in.",
        )
    if user.status is not UserStatus.ACTIVE:
        raise AppError(
            status.HTTP_403_FORBIDDEN, "account_disabled", "This account is no longer active."
        )

    await rate_limit.clear_failures(email)
    user.last_login_at = datetime.now(UTC)
    if needs_rehash(user.password_hash):
        user.password_hash = hash_password(password)
    await session.commit()
    return user


async def issue_tokens(session: AsyncSession, user: User) -> tuple[str, str]:
    refresh = await _persist_refresh(session, user.id, uuid.uuid4())
    await session.commit()
    return _access_token(user), refresh


async def rotate_tokens(session: AsyncSession, raw_token: str) -> tuple[str, str]:
    stored = await session.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == sha256(raw_token))
    )
    if stored is None:
        raise unauthorized("Session expired. Please sign in again.")

    if stored.revoked_at is not None:
        await _revoke_family(session, stored.family_id)
        await session.commit()
        raise unauthorized("Session revoked. Please sign in again.")

    if stored.expires_at <= datetime.now(UTC):
        raise unauthorized("Session expired. Please sign in again.")

    user = await session.get(User, stored.user_id)
    if user is None or user.status is not UserStatus.ACTIVE:
        await _revoke_family(session, stored.family_id)
        await session.commit()
        raise unauthorized("Session expired. Please sign in again.")

    stored.revoked_at = datetime.now(UTC)
    refresh = await _persist_refresh(session, user.id, stored.family_id)
    await session.commit()
    return _access_token(user), refresh


async def revoke_session(session: AsyncSession, raw_token: str) -> None:
    stored = await session.scalar(
        select(RefreshToken).where(RefreshToken.token_hash == sha256(raw_token))
    )
    if stored is not None:
        await _revoke_family(session, stored.family_id)
        await session.commit()


async def revoke_all(session: AsyncSession, user_id: uuid.UUID) -> None:
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.user_id == user_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )


def _access_token(user: User) -> str:
    return create_jwt(str(user.id), ACCESS, settings.access_token_ttl)


async def _persist_refresh(session: AsyncSession, user_id: uuid.UUID, family_id: uuid.UUID) -> str:
    raw, token_hash = new_refresh_token()
    session.add(
        RefreshToken(
            user_id=user_id,
            token_hash=token_hash,
            family_id=family_id,
            expires_at=datetime.now(UTC) + timedelta(seconds=settings.refresh_token_ttl),
        )
    )
    return raw


async def _revoke_family(session: AsyncSession, family_id: uuid.UUID) -> None:
    await session.execute(
        update(RefreshToken)
        .where(RefreshToken.family_id == family_id, RefreshToken.revoked_at.is_(None))
        .values(revoked_at=datetime.now(UTC))
    )


async def _decode_subject(
    session: AsyncSession, token: str, purpose: str
) -> tuple[User, dict[str, object]]:
    try:
        payload = decode_jwt(token, purpose)
        user_id = uuid.UUID(payload["sub"])
    except (jwt.PyJWTError, KeyError, ValueError):
        raise _invalid_link() from None

    user = await session.get(User, user_id)
    if user is None or user.status in (UserStatus.SUSPENDED, UserStatus.DELETED):
        raise _invalid_link()
    return user, payload
