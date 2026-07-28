"""unique url slug for each super admin"""

import sqlalchemy as sa

from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("users", sa.Column("slug", sa.String(80), nullable=True))
    op.create_index("ix_users_slug", "users", ["slug"], unique=True)


def downgrade() -> None:
    op.drop_index("ix_users_slug", "users")
    op.drop_column("users", "slug")
