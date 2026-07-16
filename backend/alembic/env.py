import asyncio
from logging.config import fileConfig

from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from app.core.config import settings
from app.db.base import Base
from app.models import user as _user  # noqa: F401  (registers tables on Base.metadata)

config = context.config
if config.config_file_name:
    fileConfig(config.config_file_name)

target_metadata = Base.metadata


def _run_migrations(connection: Connection) -> None:
    context.configure(connection=connection, target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


async def run_online() -> None:
    engine = create_async_engine(str(settings.database_url))
    async with engine.connect() as connection:
        await connection.run_sync(_run_migrations)
    await engine.dispose()


def run_offline() -> None:
    context.configure(url=str(settings.database_url), target_metadata=target_metadata)
    with context.begin_transaction():
        context.run_migrations()


if context.is_offline_mode():
    run_offline()
else:
    asyncio.run(run_online())
