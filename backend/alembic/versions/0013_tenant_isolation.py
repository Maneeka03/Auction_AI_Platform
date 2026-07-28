"""per-super-admin tenant isolation"""

import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

from alembic import op

revision = "0013"
down_revision = "0012"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # users: self-referential tenant_id — the super admin who owns this account
    op.add_column("users", sa.Column("tenant_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_users_tenant_id",
        "users",
        "users",
        ["tenant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_users_tenant_id", "users", ["tenant_id"])

    # properties: the super admin who owns this listing
    op.add_column("properties", sa.Column("tenant_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_properties_tenant_id",
        "properties",
        "users",
        ["tenant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_properties_tenant_id", "properties", ["tenant_id"])

    # campaigns: the super admin who owns this campaign
    op.add_column("campaigns", sa.Column("tenant_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_campaigns_tenant_id",
        "campaigns",
        "users",
        ["tenant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_campaigns_tenant_id", "campaigns", ["tenant_id"])

    # leads: the super admin who owns this lead pipeline
    op.add_column("leads", sa.Column("tenant_id", UUID(as_uuid=True), nullable=True))
    op.create_foreign_key(
        "fk_leads_tenant_id",
        "leads",
        "users",
        ["tenant_id"],
        ["id"],
        ondelete="SET NULL",
    )
    op.create_index("ix_leads_tenant_id", "leads", ["tenant_id"])


def downgrade() -> None:
    op.drop_constraint("fk_leads_tenant_id", "leads", type_="foreignkey")
    op.drop_index("ix_leads_tenant_id", "leads")
    op.drop_column("leads", "tenant_id")

    op.drop_constraint("fk_campaigns_tenant_id", "campaigns", type_="foreignkey")
    op.drop_index("ix_campaigns_tenant_id", "campaigns")
    op.drop_column("campaigns", "tenant_id")

    op.drop_constraint("fk_properties_tenant_id", "properties", type_="foreignkey")
    op.drop_index("ix_properties_tenant_id", "properties")
    op.drop_column("properties", "tenant_id")

    op.drop_constraint("fk_users_tenant_id", "users", type_="foreignkey")
    op.drop_index("ix_users_tenant_id", "users")
    op.drop_column("users", "tenant_id")
