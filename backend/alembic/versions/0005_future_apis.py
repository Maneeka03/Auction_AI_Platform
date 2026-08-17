"""watchlist, seller payout ledger kind"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0005"
down_revision = "0004"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # A seller is now paid when their listing sells - see services/wallets.credit.
    op.execute("ALTER TYPE wallet_entry_kind ADD VALUE IF NOT EXISTS 'payout'")

    op.create_table(
        "watchlist_items",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )


def downgrade() -> None:
    op.drop_table("watchlist_items")
    # wallet_entry_kind keeps 'payout': PostgreSQL cannot drop a value from an enum.
