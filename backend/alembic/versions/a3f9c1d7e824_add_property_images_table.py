"""add property_images table

Revision ID: a3f9c1d7e824
Revises: 87c4eabe55db
Create Date: 2026-08-02
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "a3f9c1d7e824"
down_revision = "87c4eabe55db"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "property_images",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("property_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("image_url", sa.String(length=500), nullable=False),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column(
            "created_at",
            sa.DateTime(timezone=True),
            server_default=sa.text("now()"),
            nullable=False,
        ),
        sa.ForeignKeyConstraint(["property_id"], ["properties.id"], ondelete="CASCADE"),
        sa.PrimaryKeyConstraint("id"),
    )
    op.create_index("ix_property_images_property_id", "property_images", ["property_id"])


def downgrade() -> None:
    op.drop_index("ix_property_images_property_id", table_name="property_images")
    op.drop_table("property_images")