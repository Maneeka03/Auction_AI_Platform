"""VIP tier rankings & virtual token system (13 Jul clarifications, Side Note D)"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0027"
down_revision = "0026"
branch_labels = None
depends_on = None

vip_tier = postgresql.ENUM(
    "none", "tier4", "tier3", "tier2", "tier1", name="vip_tier", create_type=False
)
vip_token_transaction_kind = postgresql.ENUM(
    "purchase",
    "spend_view",
    "admin_grant",
    name="vip_token_transaction_kind",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    vip_tier.create(bind, checkfirst=True)
    vip_token_transaction_kind.create(bind, checkfirst=True)

    op.create_table(
        "vip_profiles",
        sa.Column("user_id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("tier", vip_tier, nullable=False, server_default="none"),
        sa.Column("token_balance", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("item_view_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("listings_completed_count", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("free_listing_credits", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "return_refund_requests_used", sa.Integer(), nullable=False, server_default="0"
        ),
        sa.Column("tier1_membership_paid_at", sa.DateTime(timezone=True)),
        sa.Column("tier1_last_purchase_at", sa.DateTime(timezone=True)),
        sa.Column("tier2_membership_paid_at", sa.DateTime(timezone=True)),
        sa.Column("tier2_qualified_by_purchase_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
    )

    op.create_table(
        "vip_token_transactions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("user_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("kind", vip_token_transaction_kind, nullable=False),
        sa.Column("quantity", sa.Integer(), nullable=False),
        sa.Column("balance_after", sa.Integer(), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True)),
        sa.Column("note", sa.String(200)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["user_id"], ["users.id"], ondelete="CASCADE"),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="SET NULL"),
    )
    op.create_index(
        "ix_vip_token_transactions_user_id", "vip_token_transactions", ["user_id"]
    )


def downgrade() -> None:
    op.drop_index("ix_vip_token_transactions_user_id", table_name="vip_token_transactions")
    op.drop_table("vip_token_transactions")
    op.drop_table("vip_profiles")
    vip_token_transaction_kind.drop(op.get_bind(), checkfirst=True)
    vip_tier.drop(op.get_bind(), checkfirst=True)
