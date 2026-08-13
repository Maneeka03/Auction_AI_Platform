"""add origin to push subscriptions"""

import sqlalchemy as sa
from alembic import op


revision = '515a088b6b7b'
down_revision = '982bd447e582'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "push_subscriptions",
        sa.Column(
            "origin",
            sa.String(length=500),
            nullable=True,
        ),
    )

def downgrade() -> None:
    op.drop_column("push_subscriptions", "origin")
