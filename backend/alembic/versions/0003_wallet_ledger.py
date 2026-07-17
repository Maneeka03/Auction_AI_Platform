"""wallet activity log, residential property detail"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0003"
down_revision = "0002"
branch_labels = None
depends_on = None

wallet_entry_kind = postgresql.ENUM(
    "deposit",
    "withdrawal",
    "bid_hold",
    "refund",
    "purchase",
    name="wallet_entry_kind",
    create_type=False,
)


def upgrade() -> None:
    wallet_entry_kind.create(op.get_bind(), checkfirst=True)

    op.add_column("properties", sa.Column("bedrooms", sa.Integer()))
    op.add_column("properties", sa.Column("bathrooms", sa.Integer()))
    op.add_column("properties", sa.Column("area_sqft", sa.Integer()))

    op.create_table(
        "wallet_entries",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", wallet_entry_kind, nullable=False),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "auction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("auctions.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_wallet_entries_user_id", "wallet_entries", ["user_id"])


def downgrade() -> None:
    op.drop_table("wallet_entries")
    op.drop_column("properties", "area_sqft")
    op.drop_column("properties", "bathrooms")
    op.drop_column("properties", "bedrooms")
    wallet_entry_kind.drop(op.get_bind(), checkfirst=True)
