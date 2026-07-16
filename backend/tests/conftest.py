import asyncio
import os
from collections.abc import AsyncIterator
from datetime import UTC, datetime

os.environ.setdefault("PROVENIX_ENVIRONMENT", "test")
os.environ.setdefault(
    "PROVENIX_DATABASE_URL",
    "postgresql+asyncpg://postgres:postgres@localhost:5432/provenix_test",
)
os.environ.setdefault("PROVENIX_REDIS_URL", "redis://localhost:6379/1")
os.environ.setdefault("PROVENIX_JWT_SECRET", "test-secret-value-with-at-least-32-characters")
os.environ.setdefault("PROVENIX_REFRESH_COOKIE_SECURE", "false")

import fakeredis.aioredis
import pytest
from httpx import ASGITransport, AsyncClient

from app.core import rate_limit
from app.core.security import hash_password
from app.db.base import Base
from app.db.session import SessionFactory, engine
from app.main import app
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.services import mail

SUPER_ADMIN_EMAIL = "root@provenix.io"
SUPER_ADMIN_PASSWORD = "SuperSecret123!"


@pytest.fixture(scope="session", autouse=True)
def schema() -> None:
    async def build() -> None:
        async with engine.begin() as connection:
            await connection.run_sync(Base.metadata.drop_all)
            await connection.run_sync(Base.metadata.create_all)
        await engine.dispose()

    asyncio.run(build())


@pytest.fixture(autouse=True)
async def isolate(monkeypatch: pytest.MonkeyPatch) -> AsyncIterator[None]:
    monkeypatch.setattr(rate_limit, "redis", fakeredis.aioredis.FakeRedis(decode_responses=True))
    mail.clear_outbox()
    async with engine.begin() as connection:
        for table in reversed(Base.metadata.sorted_tables):
            await connection.execute(table.delete())
    yield


@pytest.fixture
async def client() -> AsyncIterator[AsyncClient]:
    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as http:
        yield http


@pytest.fixture
async def super_admin() -> None:
    async with SessionFactory() as session:
        session.add(
            User(
                email=SUPER_ADMIN_EMAIL,
                password_hash=hash_password(SUPER_ADMIN_PASSWORD),
                full_name="Root Admin",
                status=UserStatus.ACTIVE,
                email_verified_at=datetime.now(UTC),
                role_rows=[UserRole(role=Role.SUPER_ADMIN)],
            )
        )
        await session.commit()


def latest_token() -> str:
    return mail.outbox()[0]["body"].split("token=")[1]
