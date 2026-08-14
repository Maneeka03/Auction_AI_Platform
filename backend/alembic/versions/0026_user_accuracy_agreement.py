"""buyer/seller self-declared information accuracy agreement (13 Jul clarifications, section 3)"""

import sqlalchemy as sa

from alembic import op

revision = "0026"
down_revision = "0025"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "users",
        sa.Column("accuracy_agreement_accepted_at", sa.DateTime(timezone=True), nullable=True),
    )


def downgrade() -> None:
    op.drop_column("users", "accuracy_agreement_accepted_at")
