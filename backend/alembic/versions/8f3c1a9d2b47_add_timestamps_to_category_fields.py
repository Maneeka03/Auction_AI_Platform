"""add created_at/updated_at to category_fields

Revision ID: 8f3c1a9d2b47
Revises: d4e7f2a1b9c3
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa

revision = "8f3c1a9d2b47"
down_revision = "d4e7f2a1b9c3"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column(
        "category_fields",
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )
    op.add_column(
        "category_fields",
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
    )


def downgrade() -> None:
    op.drop_column("category_fields", "updated_at")
    op.drop_column("category_fields", "created_at")