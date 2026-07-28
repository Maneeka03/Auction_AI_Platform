"""scope categories to super-admin tenants"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0015"
down_revision = "0014"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add tenant_id column
    op.add_column(
        "categories",
        sa.Column("tenant_id", postgresql.UUID(as_uuid=True), nullable=True),
    )
    op.create_foreign_key(
        "fk_categories_tenant_id",
        "categories",
        "users",
        ["tenant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_categories_tenant_id", "categories", ["tenant_id"])

    # Drop the old global uniqueness indexes (slug unique globally)
    op.drop_index("uq_categories_main_slug", table_name="categories")
    op.drop_index("uq_categories_sub_slug", table_name="categories")

    # New per-tenant uniqueness: same slug allowed across different tenants
    op.create_index(
        "uq_categories_main_tenant_slug",
        "categories",
        ["tenant_id", "slug"],
        unique=True,
        postgresql_where=sa.text("parent_id IS NULL"),
    )
    op.create_index(
        "uq_categories_sub_tenant_slug",
        "categories",
        ["tenant_id", "parent_id", "slug"],
        unique=True,
        postgresql_where=sa.text("parent_id IS NOT NULL"),
    )


def downgrade() -> None:
    op.drop_index("uq_categories_sub_tenant_slug", table_name="categories")
    op.drop_index("uq_categories_main_tenant_slug", table_name="categories")
    op.drop_index("ix_categories_tenant_id", table_name="categories")
    op.drop_constraint("fk_categories_tenant_id", "categories", type_="foreignkey")
    op.drop_column("categories", "tenant_id")
    op.create_index(
        "uq_categories_main_slug",
        "categories",
        ["slug"],
        unique=True,
        postgresql_where=sa.text("parent_id IS NULL"),
    )
    op.create_index(
        "uq_categories_sub_slug",
        "categories",
        ["parent_id", "slug"],
        unique=True,
        postgresql_where=sa.text("parent_id IS NOT NULL"),
    )
