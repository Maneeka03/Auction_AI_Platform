"""seller bank account details"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0024"
down_revision = "0023"
branch_labels = None
depends_on = None

bank_account_type = postgresql.ENUM(
    "savings", "current", name="bank_account_type", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    bank_account_type.create(bind, checkfirst=True)

    op.create_table(
        "seller_bank_accounts",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("account_holder_name", sa.String(200), nullable=False),
        sa.Column("bank_name", sa.String(200), nullable=False),
        sa.Column("account_number", sa.String(34), nullable=False),
        sa.Column("ifsc_code", sa.String(11), nullable=False),
        sa.Column("branch_name", sa.String(200)),
        sa.Column(
            "account_type", bank_account_type, nullable=False, server_default="savings"
        ),
        sa.Column(
            "is_verified", sa.Boolean(), nullable=False, server_default=sa.false()
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index(
        "ix_seller_bank_accounts_user_id", "seller_bank_accounts", ["user_id"], unique=True
    )


def downgrade() -> None:
    op.drop_table("seller_bank_accounts")
    bank_account_type.drop(op.get_bind(), checkfirst=True)
