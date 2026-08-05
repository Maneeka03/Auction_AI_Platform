"""add ticket_subjects table and switch support_tickets to use it

Revision ID: c2d5b8a04e77
Revises: f4a8d2c6e91b
Create Date: 2026-08-05
"""

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

revision = "c2d5b8a04e77"
down_revision = "f4a8d2c6e91b"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        "ticket_subjects",
        sa.Column("id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("name", sa.String(length=150), nullable=False),
        sa.Column("is_active", sa.Boolean(), nullable=False, server_default="true"),
        sa.Column("sort_order", sa.Integer(), nullable=False, server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("now()"), nullable=False),
        sa.PrimaryKeyConstraint("id"),
        sa.UniqueConstraint("name"),
    )

    op.add_column("support_tickets", sa.Column("subject_id", postgresql.UUID(as_uuid=True), nullable=True))
    op.add_column("support_tickets", sa.Column("custom_subject", sa.String(length=200), nullable=True))
    op.create_foreign_key(
        "fk_support_tickets_subject_id",
        "support_tickets",
        "ticket_subjects",
        ["subject_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.execute("UPDATE support_tickets SET custom_subject = subject WHERE subject IS NOT NULL")
    op.drop_column("support_tickets", "subject")


def downgrade() -> None:
    op.add_column("support_tickets", sa.Column("subject", sa.String(length=200), nullable=True))
    op.execute("UPDATE support_tickets SET subject = COALESCE(custom_subject, 'Unknown')")
    op.alter_column("support_tickets", "subject", nullable=False)
    op.drop_constraint("fk_support_tickets_subject_id", "support_tickets", type_="foreignkey")
    op.drop_column("support_tickets", "subject_id")
    op.drop_column("support_tickets", "custom_subject")
    op.drop_table("ticket_subjects")