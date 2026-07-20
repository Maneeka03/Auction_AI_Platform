"""messaging, leads, campaigns, property views, escrow, property coordinates"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0006"
down_revision = "0005"
branch_labels = None
depends_on = None

lead_status = postgresql.ENUM(
    "new", "contacted", "qualified", "won", "lost", name="lead_status", create_type=False
)
campaign_channel = postgresql.ENUM(
    "email", "sms", "push", name="campaign_channel", create_type=False
)
campaign_status = postgresql.ENUM(
    "draft", "scheduled", "sent", "archived", name="campaign_status", create_type=False
)
escrow_state = postgresql.ENUM(
    "funds_locked",
    "asset_held",
    "authenticated",
    "released",
    name="escrow_state",
    create_type=False,
)


def _uuid() -> postgresql.UUID:
    return postgresql.UUID(as_uuid=True)


def _fk(table: str, ondelete: str) -> sa.ForeignKey:
    return sa.ForeignKey(f"{table}.id", ondelete=ondelete)


def upgrade() -> None:
    bind = op.get_bind()
    lead_status.create(bind, checkfirst=True)
    campaign_channel.create(bind, checkfirst=True)
    campaign_status.create(bind, checkfirst=True)
    escrow_state.create(bind, checkfirst=True)

    op.add_column("properties", sa.Column("latitude", sa.Numeric(9, 6)))
    op.add_column("properties", sa.Column("longitude", sa.Numeric(9, 6)))

    op.create_table(
        "messages",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("sender_id", _uuid(), _fk("users", "CASCADE"), nullable=False),
        sa.Column("recipient_id", _uuid(), _fk("users", "CASCADE"), nullable=False),
        sa.Column("property_id", _uuid(), _fk("properties", "SET NULL")),
        sa.Column("body", sa.String(2000), nullable=False),
        sa.Column("read_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_messages_sender_id", "messages", ["sender_id"])
    op.create_index("ix_messages_recipient_id", "messages", ["recipient_id"])

    op.create_table(
        "leads",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("email", sa.String(320)),
        sa.Column("phone", sa.String(40)),
        sa.Column("source", sa.String(60)),
        sa.Column("status", lead_status, nullable=False, server_default="new"),
        sa.Column("notes", sa.Text()),
        sa.Column("owner_id", _uuid(), _fk("users", "SET NULL")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_leads_status", "leads", ["status"])

    op.create_table(
        "campaigns",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("name", sa.String(160), nullable=False),
        sa.Column("channel", campaign_channel, nullable=False),
        sa.Column("status", campaign_status, nullable=False, server_default="draft"),
        sa.Column("subject", sa.String(200)),
        sa.Column("body", sa.Text(), nullable=False),
        sa.Column("audience", sa.String(60)),
        sa.Column("scheduled_at", sa.DateTime(timezone=True)),
        sa.Column("sent_at", sa.DateTime(timezone=True)),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_campaigns_status", "campaigns", ["status"])

    op.create_table(
        "property_views",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("property_id", _uuid(), _fk("properties", "CASCADE"), nullable=False),
        sa.Column("viewer_id", _uuid(), _fk("users", "SET NULL")),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_property_views_property_id", "property_views", ["property_id"])

    op.create_table(
        "escrows",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("property_id", _uuid(), _fk("properties", "CASCADE"), nullable=False),
        sa.Column("buyer_id", _uuid(), _fk("users", "SET NULL")),
        sa.Column("seller_id", _uuid(), _fk("users", "SET NULL")),
        sa.Column("auction_id", _uuid(), _fk("auctions", "SET NULL")),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column("state", escrow_state, nullable=False, server_default="funds_locked"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_escrows_property_id", "escrows", ["property_id"])
    op.create_index("ix_escrows_state", "escrows", ["state"])


def downgrade() -> None:
    op.drop_table("escrows")
    op.drop_table("property_views")
    op.drop_table("campaigns")
    op.drop_table("leads")
    op.drop_table("messages")
    op.drop_column("properties", "longitude")
    op.drop_column("properties", "latitude")

    bind = op.get_bind()
    escrow_state.drop(bind, checkfirst=True)
    campaign_status.drop(bind, checkfirst=True)
    campaign_channel.drop(bind, checkfirst=True)
    lead_status.drop(bind, checkfirst=True)
