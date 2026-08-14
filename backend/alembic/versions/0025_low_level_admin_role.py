"""add low_level_admin role (13 Jul clarifications, section 1)"""

from alembic import op

revision = "0025"
down_revision = "515a088b6b7b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # ALTER TYPE ... ADD VALUE cannot run inside the transaction alembic normally wraps a
    # migration in on Postgres < 12; run it in its own autocommit block to be safe.
    with op.get_context().autocommit_block():
        op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'low_level_admin'")


def downgrade() -> None:
    # Removing an enum value requires rebuilding the type; not worth it for a role that, if
    # unused, is simply inert. Left as a no-op like the codebase's other enum-add migrations.
    pass
