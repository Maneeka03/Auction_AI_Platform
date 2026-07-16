import hashlib
import secrets
import time
import uuid
from typing import Any

import jwt
from argon2 import PasswordHasher
from argon2.exceptions import InvalidHashError, VerificationError

from app.core.config import settings

_hasher = PasswordHasher()


def hash_password(password: str) -> str:
    return _hasher.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    try:
        return _hasher.verify(password_hash, password)
    except (VerificationError, InvalidHashError):
        return False


def needs_rehash(password_hash: str) -> bool:
    return _hasher.check_needs_rehash(password_hash)


def sha256(value: str) -> str:
    return hashlib.sha256(value.encode()).hexdigest()


def create_jwt(subject: str, purpose: str, ttl: int, **claims: Any) -> str:
    now = int(time.time())
    payload = {
        "sub": subject,
        "purpose": purpose,
        "iss": settings.jwt_issuer,
        "iat": now,
        "exp": now + ttl,
        "jti": uuid.uuid4().hex,
        **claims,
    }
    return jwt.encode(payload, settings.jwt_secret, algorithm=settings.jwt_algorithm)


def decode_jwt(token: str, purpose: str) -> dict[str, Any]:
    payload: dict[str, Any] = jwt.decode(
        token,
        settings.jwt_secret,
        algorithms=[settings.jwt_algorithm],
        issuer=settings.jwt_issuer,
    )
    if payload.get("purpose") != purpose:
        raise jwt.InvalidTokenError("purpose mismatch")
    return payload


def new_refresh_token() -> tuple[str, str]:
    raw = secrets.token_urlsafe(48)
    return raw, sha256(raw)


def password_fingerprint(password_hash: str | None) -> str:
    return sha256(password_hash or "")[:16]
