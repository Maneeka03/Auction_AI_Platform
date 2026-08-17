"""Add listings table — created on 2-of-3 approval of a property"""

import sqlalchemy as sa

from alembic import op

revision = "0019"
down_revision = ("1ac4c5dea2a4", "a3f9c1d7e824")
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "listings",
        sa.Column("id", sa.UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("property_id", sa.UUID(as_uuid=True), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False, unique=True),
        sa.Column("status", sa.String(20), nullable=False, server_default="active"),
        sa.Column("reserve_price", sa.Numeric(12, 2), nullable=True),
        sa.Column("listed_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=True),
        sa.Column("created_at", sa.DateTime(timezone=True), nullable=False, server_default=sa.text("now()")),
    )
    op.create_index("ix_listings_property_id", "listings", ["property_id"])
    op.create_index("ix_listings_status", "listings", ["status"])


def downgrade() -> None:
    op.drop_index("ix_listings_status", "listings")
    op.drop_index("ix_listings_property_id", "listings")
    op.drop_table("listings")
