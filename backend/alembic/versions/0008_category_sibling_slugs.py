"""scope category name uniqueness to siblings, so "Antique" can exist under two parents"""

import sqlalchemy as sa

from alembic import op

revision = "0008"
down_revision = "0007"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.drop_index("ix_categories_slug", table_name="categories")
    # Two partial indexes rather than one on (parent_id, slug): NULLs compare as distinct in a plain
    # unique index, which would let two main categories share a slug.
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


def downgrade() -> None:
    op.drop_index("uq_categories_sub_slug", table_name="categories")
    op.drop_index("uq_categories_main_slug", table_name="categories")
    op.create_index("ix_categories_slug", "categories", ["slug"], unique=True)
