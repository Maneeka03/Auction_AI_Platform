import asyncio
from logging.config import fileConfig

from sqlalchemy.engine import Connection
from sqlalchemy.ext.asyncio import create_async_engine

from alembic import context
from app.core.config import settings
from app.db.base import Base

# Registers every table on Base.metadata. user must stay - the others carry foreign keys to it.
from app.models import analytics as _analytics  # noqa: F401
from app.models import auction as _auction  # noqa: F401
from app.models import campaign as _campaign  # noqa: F401
from app.models import escrow as _escrow  # noqa: F401
from app.models import kyc as _kyc  # noqa: F401
from app.models import lead as _lead  # noqa: F401
from app.models import messaging as _messaging  # noqa: F401
from app.models import notification as _notification  # noqa: F401
from app.models import property as _property  # noqa: F401
from app.models import user as _user  # noqa: F401
from app.models import wallet as _wallet  # noqa: F401
from app.models import watchlist as _watchlist  # noqa: F401

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
