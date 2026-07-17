"""sign-off votes, direct purchase, notifications, kyc"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0004"
down_revision = "0003"
branch_labels = None
depends_on = None

payment_method = postgresql.ENUM("token", "full", name="payment_method", create_type=False)
approver_role = postgresql.ENUM(
    "director", "appraiser", "legal_finance", name="approver_role", create_type=False
)
kyc_status = postgresql.ENUM(
    "pending", "approved", "rejected", name="kyc_status", create_type=False
)
notification_kind = postgresql.ENUM(
    "outbid",
    "auction_won",
    "auction_lost",
    "property_approved",
    "property_rejected",
    "kyc_reviewed",
    name="notification_kind",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    payment_method.create(bind, checkfirst=True)
    approver_role.create(bind, checkfirst=True)
    kyc_status.create(bind, checkfirst=True)
    notification_kind.create(bind, checkfirst=True)

    # A listing can now be turned down by the review panel.
    op.execute("ALTER TYPE property_status ADD VALUE IF NOT EXISTS 'rejected'")

    op.add_column(
        "properties",
        sa.Column(
            "buyer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
    )
    op.add_column("properties", sa.Column("payment_method", payment_method))
    op.add_column("properties", sa.Column("paid_amount", sa.Numeric(12, 2)))
    op.add_column("properties", sa.Column("purchased_at", sa.DateTime(timezone=True)))

    op.create_table(
        "property_votes",
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("seat", approver_role, primary_key=True),
        sa.Column(
            "voter_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("approved", sa.Boolean(), nullable=False),
        sa.Column(
            "decided_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )

    op.create_table(
        "notifications",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("kind", notification_kind, nullable=False),
        sa.Column("message", sa.String(300), nullable=False),
        sa.Column(
            "auction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("auctions.id", ondelete="CASCADE"),
        ),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
        ),
        sa.Column("read_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_notifications_user_id", "notifications", ["user_id"])

    op.create_table(
        "kyc_submissions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("status", kyc_status, nullable=False, server_default="pending"),
        sa.Column("legal_name", sa.String(200), nullable=False),
        sa.Column("document_keys", postgresql.ARRAY(sa.String(500)), nullable=False),
        sa.Column(
            "reviewer_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column("reviewed_at", sa.DateTime(timezone=True)),
        sa.Column("notes", sa.Text()),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_kyc_submissions_user_id", "kyc_submissions", ["user_id"], unique=True)
    op.create_index("ix_kyc_submissions_status", "kyc_submissions", ["status"])


def downgrade() -> None:
    op.drop_table("kyc_submissions")
    op.drop_table("notifications")
    op.drop_table("property_votes")
    op.drop_column("properties", "purchased_at")
    op.drop_column("properties", "paid_amount")
    op.drop_column("properties", "payment_method")
    op.drop_column("properties", "buyer_id")

    bind = op.get_bind()
    notification_kind.drop(bind, checkfirst=True)
    kyc_status.drop(bind, checkfirst=True)
    approver_role.drop(bind, checkfirst=True)
    payment_method.drop(bind, checkfirst=True)
    # property_status keeps its 'rejected' value: PostgreSQL cannot drop one from an enum.
