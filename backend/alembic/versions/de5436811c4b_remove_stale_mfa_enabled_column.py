"""remove stale mfa enabled column"""

import sqlalchemy as sa
from alembic import op


revision = "de5436811c4b"
down_revision = "ce2da147ebd2"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_column("users", "mfa_enabled")


def downgrade() -> None:
    op.add_column(
        "users",
        sa.Column(
            "mfa_enabled",
            sa.Boolean(),
            nullable=False,
            server_default=sa.false(),
        ),
    )