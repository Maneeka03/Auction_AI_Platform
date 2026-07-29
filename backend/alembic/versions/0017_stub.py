"""stub for migrations that were applied to the DB but whose files were not committed"""

from alembic import op  # noqa: F401

revision = "0017"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    pass


def downgrade() -> None:
    pass
