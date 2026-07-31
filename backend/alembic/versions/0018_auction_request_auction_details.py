"""Add auction detail columns to auction_requests and auction_id link"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0018"
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "auction_requests",
        sa.Column("opening_bid", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "auction_requests",
        sa.Column("reserve_price", sa.Numeric(12, 2), nullable=True),
    )
    op.add_column(
        "auction_requests",
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=True),
    )
    op.add_column(
        "auction_requests",
        sa.Column(
            "increments",
            postgresql.ARRAY(sa.Numeric(12, 2)),
            nullable=True,
        ),
    )
    op.add_column(
        "auction_requests",
        sa.Column(
            "auction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("auctions.id", ondelete="SET NULL"),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column("auction_requests", "auction_id")
    op.drop_column("auction_requests", "increments")
    op.drop_column("auction_requests", "ends_at")
    op.drop_column("auction_requests", "reserve_price")
    op.drop_column("auction_requests", "opening_bid")
