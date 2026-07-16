"""auctions: properties, auctions, invites, bids, wallets"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0002"
down_revision = "0001"
branch_labels = None
depends_on = None

property_category = postgresql.ENUM(
    "residential", "commercial", name="property_category", create_type=False
)
property_status = postgresql.ENUM(
    "draft", "published", "sold", name="property_status", create_type=False
)
room_access = postgresql.ENUM("open", "invite_only", name="room_access", create_type=False)


def upgrade() -> None:
    bind = op.get_bind()
    property_category.create(bind, checkfirst=True)
    property_status.create(bind, checkfirst=True)
    room_access.create(bind, checkfirst=True)

    op.create_table(
        "properties",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("address", sa.String(300), nullable=False),
        sa.Column("category", property_category, nullable=False),
        sa.Column("status", property_status, nullable=False, server_default="draft"),
        sa.Column("description", sa.Text()),
        sa.Column("image_url", sa.String(500)),
        sa.Column("reserve_price", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "seller_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_properties_status", "properties", ["status"])
    op.create_index("ix_properties_seller_id", "properties", ["seller_id"])

    op.create_table(
        "auctions",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "property_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("properties.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("starts_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ends_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("ended_at", sa.DateTime(timezone=True)),
        sa.Column("opening_bid", sa.Numeric(12, 2), nullable=False),
        sa.Column("reserve_price", sa.Numeric(12, 2), nullable=False),
        sa.Column("room_access", room_access, nullable=False, server_default="open"),
        sa.Column("increments", postgresql.ARRAY(sa.Numeric(12, 2)), nullable=False),
        sa.Column("token_percent", sa.Numeric(5, 2), nullable=False, server_default="100"),
        sa.Column(
            "winner_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="SET NULL"),
        ),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_auctions_property_id", "auctions", ["property_id"])

    op.create_table(
        "auction_invites",
        sa.Column(
            "auction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("auctions.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
    )

    op.create_table(
        "bids",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "auction_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("auctions.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column(
            "bidder_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("amount", sa.Numeric(12, 2), nullable=False),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_bids_auction_id", "bids", ["auction_id"])
    op.create_index("ix_bids_bidder_id", "bids", ["bidder_id"])

    op.create_table(
        "wallets",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        # Uniqueness comes from ix_wallets_user_id below, and from that index alone: the ON CONFLICT
        # upsert in services/wallets.locked needs exactly one arbiter index to infer.
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("balance", sa.Numeric(12, 2), nullable=False, server_default="0"),
        sa.Column(
            "created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
        sa.Column(
            "updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False
        ),
    )
    op.create_index("ix_wallets_user_id", "wallets", ["user_id"], unique=True)


def downgrade() -> None:
    op.drop_table("wallets")
    op.drop_table("bids")
    op.drop_table("auction_invites")
    op.drop_table("auctions")
    op.drop_table("properties")
    bind = op.get_bind()
    room_access.drop(bind, checkfirst=True)
    property_status.drop(bind, checkfirst=True)
    property_category.drop(bind, checkfirst=True)
