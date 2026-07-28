"""auction categories: any domain, two levels, replacing the hardcoded property_category enum"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0007"
down_revision = "0006"
branch_labels = None
depends_on = None

property_category = postgresql.ENUM(
    "residential", "commercial", name="property_category", create_type=False
)


def upgrade() -> None:
    op.create_table(
        "categories",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("slug", sa.String(140), nullable=False),
        sa.Column(
            "parent_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id", ondelete="CASCADE"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)
    op.create_index("ix_categories_parent_id", "categories", ["parent_id"])

    # The two categories that used to be hardcoded in the enum, so existing listings survive.
    op.execute(
        "INSERT INTO categories (id, name, slug, created_at, updated_at) VALUES "
        "(gen_random_uuid(), 'Residential', 'residential', now(), now()), "
        "(gen_random_uuid(), 'Commercial', 'commercial', now(), now())"
    )

    op.add_column(
        "properties",
        sa.Column(
            "category_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("categories.id", ondelete="RESTRICT"),
        ),
    )
    # The old enum values and the seeded slugs are the same strings, so this moves every listing.
    op.execute(
        "UPDATE properties p SET category_id = c.id "
        "FROM categories c WHERE c.slug = p.category::text"
    )
    op.alter_column("properties", "category_id", nullable=False)
    op.create_index("ix_properties_category_id", "properties", ["category_id"])

    op.drop_column("properties", "category")
    property_category.drop(op.get_bind(), checkfirst=True)


def downgrade() -> None:
    property_category.create(op.get_bind(), checkfirst=True)
    op.add_column("properties", sa.Column("category", property_category))
    # Only listings still on one of the two original categories can be put back.
    op.execute(
        "UPDATE properties p SET category = c.slug::property_category "
        "FROM categories c WHERE c.id = p.category_id AND c.slug IN ('residential', 'commercial')"
    )

    op.drop_index("ix_properties_category_id", "properties")
    op.drop_column("properties", "category_id")
    op.drop_table("categories")
