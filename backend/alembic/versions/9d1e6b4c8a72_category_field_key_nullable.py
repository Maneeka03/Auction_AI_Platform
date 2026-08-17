"""category_fields.field_key was left NOT NULL by an uncommitted migration (0021) whose column
the current CategoryField model (app/models/category.py) never mapped. Every ORM-level insert
(services/categories.py, services/category_requests.py) omits it, so creating a category field
through the app crashes with a not-null violation. Relaxing it instead of dropping it, since 0021
already seeded ~100 rows with real values in it - no data loss either way."""

from alembic import op

revision = "9d1e6b4c8a72"
down_revision = "0028"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("ALTER TABLE category_fields ALTER COLUMN field_key DROP NOT NULL")


def downgrade() -> None:
    # Not reversible without knowing which rows would violate NOT NULL again; left as a no-op.
    pass
