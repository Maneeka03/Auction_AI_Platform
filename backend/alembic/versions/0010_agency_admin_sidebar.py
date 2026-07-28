"""agency admin role, sidebar catalogue and per-admin preferences"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0010"
down_revision = "0009"
branch_labels = None
depends_on = None

# The super-admin sidebar, flattened in display order - the catalogue an agency admin customises.
ITEMS = [
    ("dashboard", "Dashboard"),
    ("approvals", "Approvals"),
    ("listings", "Listings"),
    ("categories", "Categories"),
    ("properties", "Browse Properties"),
    ("escrow", "Escrow"),
    ("wallet", "Wallet"),
    ("auctions", "Live Auctions"),
    ("crm-buyers", "Buyers"),
    ("crm-sellers", "Sellers"),
    ("leads", "Leads"),
    ("campaigns", "Campaigns"),
    ("revenue", "Revenue"),
    ("auction-activity", "Auction Activity"),
    ("users", "User Management"),
    ("kyc", "KYC Review"),
    ("settings", "Settings"),
]


def upgrade() -> None:
    op.execute("ALTER TYPE role ADD VALUE IF NOT EXISTS 'agency_admin'")

    op.create_table(
        "sidebar_items",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("key", sa.String(60), nullable=False),
        sa.Column("label", sa.String(120), nullable=False),
        sa.Column("default_order", sa.Integer(), nullable=False),
    )
    op.create_index("ix_sidebar_items_key", "sidebar_items", ["key"], unique=True)

    op.create_table(
        "sidebar_preferences",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "item_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("sidebar_items.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("visible", sa.Boolean(), nullable=False, server_default=sa.true()),
        sa.Column("position", sa.Integer(), nullable=False),
    )

    insert = sa.text(
        "INSERT INTO sidebar_items (id, key, label, default_order) "
        "VALUES (gen_random_uuid(), :key, :label, :order)"
    )
    for order, (key, label) in enumerate(ITEMS):
        op.execute(insert.bindparams(key=key, label=label, order=order))


def downgrade() -> None:
    op.drop_table("sidebar_preferences")
    op.drop_table("sidebar_items")
    # role keeps its 'agency_admin' value: PostgreSQL cannot drop a value from an enum.
