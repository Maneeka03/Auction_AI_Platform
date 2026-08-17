"""add insurance_premium wallet entry kind - buyer pays for their shipping insurance, the
platform (super admin) receives it"""

from alembic import op

revision = "f2a6e91c4d8b"
down_revision = "de5436811c4b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE wallet_entry_kind ADD VALUE IF NOT EXISTS 'insurance_premium'")


def downgrade() -> None:
    # PostgreSQL does not support removing enum values; downgrade is a no-op.
    pass