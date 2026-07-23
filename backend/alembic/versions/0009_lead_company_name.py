"""add company_name to leads"""

import sqlalchemy as sa

from alembic import op

revision = "0009"
down_revision = "0008"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("leads", sa.Column("company_name", sa.String(160)))


def downgrade() -> None:
    op.drop_column("leads", "company_name")