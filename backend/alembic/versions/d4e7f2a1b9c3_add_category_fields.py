"""add category_fields table and custom_fields on properties

Revision ID: d4e7f2a1b9c3
Revises: c2d5b8a04e77
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "d4e7f2a1b9c3"
down_revision = "c2d5b8a04e77"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("""
        DO $$
        BEGIN
            IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'category_field_type') THEN
                CREATE TYPE category_field_type AS ENUM ('text', 'number', 'dropdown', 'date', 'boolean', 'file');
            END IF;
        END
        $$
    """)

    op.execute("""
        CREATE TABLE IF NOT EXISTS category_fields (
            id UUID NOT NULL,
            category_id UUID NOT NULL,
            label VARCHAR(120) NOT NULL,
            field_type category_field_type NOT NULL,
            options JSONB,
            required BOOLEAN NOT NULL DEFAULT false,
            sort_order INTEGER NOT NULL DEFAULT 0,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (id),
            CONSTRAINT fk_category_fields_category
                FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE
        )
    """)

    op.execute("""
        CREATE INDEX IF NOT EXISTS ix_category_fields_category_id
        ON category_fields (category_id)
    """)

    op.execute("""
        ALTER TABLE properties
        ADD COLUMN IF NOT EXISTS custom_fields JSONB
    """)


def downgrade() -> None:
    op.execute("ALTER TABLE properties DROP COLUMN IF EXISTS custom_fields")
    op.execute("DROP INDEX IF EXISTS ix_category_fields_category_id")
    op.drop_table("category_fields")
    op.execute("DROP TYPE IF EXISTS category_field_type")
