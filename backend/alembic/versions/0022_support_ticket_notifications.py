"""add support ticket notification kind"""

from alembic import op

revision = "0022"
down_revision = "c9b165e17986"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TYPE notification_kind ADD VALUE IF NOT EXISTS 'support_ticket'")


def downgrade() -> None:
    # PostgreSQL enums cannot remove an individual value safely.
    pass
