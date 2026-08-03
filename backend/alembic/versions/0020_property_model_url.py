"""Add model_url (GLB 3D model) to properties"""

import sqlalchemy as sa

from alembic import op

revision = "0020"
down_revision = "0019"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.add_column("properties", sa.Column("model_url", sa.String(length=500), nullable=True))


def downgrade() -> None:
    op.drop_column("properties", "model_url")
