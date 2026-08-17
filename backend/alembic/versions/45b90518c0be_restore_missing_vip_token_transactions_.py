"""restore missing vip token transactions table"""

import sqlalchemy as sa
from alembic import op
from sqlalchemy.dialects import postgresql


revision = "45b90518c0be"
down_revision = "b1f7c3e9a204"
branch_labels = None
depends_on = None


vip_token_transaction_kind = postgresql.ENUM(
    "purchase",
    "spend_view",
    "admin_grant",
    name="vip_token_transaction_kind",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()

    vip_token_transaction_kind.create(bind, checkfirst=True)

    # Only restore the table that is missing.
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
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.func.now(),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(
            ["user_id"],
            ["users.id"],
            ondelete="CASCADE",
        ),
        sa.ForeignKeyConstraint(
            ["property_id"],
            ["properties.id"],
            ondelete="SET NULL",
        ),
    )

    op.create_index(
        "ix_vip_token_transactions_user_id",
        "vip_token_transactions",
        ["user_id"],
    )


def downgrade() -> None:
    op.drop_index(
        "ix_vip_token_transactions_user_id",
        table_name="vip_token_transactions",
    )
    op.drop_table("vip_token_transactions")