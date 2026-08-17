"""If this database was ever migrated by a different branch's history before landing on this
codebase's migrations, `escrows` can be left with extra columns (e.g. `currency`,
`insurance_required`) that the current Escrow model (app/models/escrow.py) never mapped - nothing
in the app sets them on insert, so a NOT NULL one (like `currency`) breaks every escrow creation.

Guarded with IF EXISTS so this is a safe no-op on a database that only ever ran this codebase's
migrations (the normal, fresh-install case)."""

from alembic import op

revision = "b1f7c3e9a204"
down_revision = "9d1e6b4c8a72"
branch_labels = None
depends_on = None

# Add any other column name here if the same symptom shows up for it.
ORPHANED_COLUMNS = ("currency", "insurance_required")


def upgrade() -> None:
    for column in ORPHANED_COLUMNS:
        op.execute(f'ALTER TABLE escrows DROP COLUMN IF EXISTS "{column}"')


def downgrade() -> None:
    # The columns' original type/constraints depend on whichever other branch created them -
    # nothing to safely recreate here.
    pass
