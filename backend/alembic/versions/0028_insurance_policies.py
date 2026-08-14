"""mandatory shipping insurance policies (13 Jul clarifications, section 2 + Side Note B)"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0028"
down_revision = "0027"
branch_labels = None
depends_on = None

insurance_policy_status = postgresql.ENUM(
    "quote_selected", "purchased", "declined", name="insurance_policy_status", create_type=False
)


def upgrade() -> None:
    bind = op.get_bind()
    insurance_policy_status.create(bind, checkfirst=True)

    op.create_table(
        "insurance_policies",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("escrow_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("provider_name", sa.String(120), nullable=False),
        sa.Column("quoted_premium", sa.Numeric(12, 2), nullable=False),
        sa.Column("coverage_amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "status", insurance_policy_status, nullable=False, server_default="quote_selected"
        ),
        sa.Column("purchased_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.ForeignKeyConstraint(["escrow_id"], ["escrows.id"], ondelete="CASCADE"),
    )
    op.create_index(
        "ix_insurance_policies_escrow_id", "insurance_policies", ["escrow_id"], unique=True
    )


def downgrade() -> None:
    op.drop_index("ix_insurance_policies_escrow_id", table_name="insurance_policies")
    op.drop_table("insurance_policies")
    insurance_policy_status.drop(op.get_bind(), checkfirst=True)
