"""auction_requests table for seller live-auction workflow"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0016"
down_revision = "0015"
branch_labels = None
depends_on = None


def _uuid() -> postgresql.UUID:
    return postgresql.UUID(as_uuid=True)


auction_request_status = postgresql.ENUM(
    "pending", "approved", "rejected", name="auction_request_status", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    auction_request_status.create(bind, checkfirst=True)

    op.create_table(
        "auction_requests",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column(
            "seller_id",
            _uuid(),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "property_id",
            _uuid(),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=True,
        ),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text(), nullable=True),
        sa.Column("requested_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("status", auction_request_status, nullable=False, server_default="pending"),
        sa.Column("admin_note", sa.Text(), nullable=True),
        sa.Column(
            "reviewed_by",
            _uuid(),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
            nullable=True,
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.Column(
            "updated_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
    )
    op.create_index("ix_auction_requests_seller_id", "auction_requests", ["seller_id"])
    op.create_index("ix_auction_requests_status", "auction_requests", ["status"])


def downgrade() -> None:
    op.drop_table("auction_requests")
    bind = op.get_bind()
    auction_request_status.drop(bind, checkfirst=True)
