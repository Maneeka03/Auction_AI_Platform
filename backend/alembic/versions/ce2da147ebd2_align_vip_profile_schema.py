# """align vip profile schema"""

# import sqlalchemy as sa
# from alembic import op


# revision = 'ce2da147ebd2'
# down_revision = '45b90518c0be'
# branch_labels = None
# depends_on = None


# def upgrade() -> None:
#     pass


# def downgrade() -> None:
#     pass

"""align vip profile schema"""

import sqlalchemy as sa
from alembic import op


revision = "ce2da147ebd2"
down_revision = "45b90518c0be"
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.alter_column(
        "vip_profiles",
        "verified_view_count",
        new_column_name="item_view_count",
    )

    op.alter_column(
        "vip_profiles",
        "listings_completed",
        new_column_name="listings_completed_count",
    )

    op.alter_column(
        "vip_profiles",
        "last_purchase_at",
        new_column_name="tier1_last_purchase_at",
    )

    op.alter_column(
        "vip_profiles",
        "returns_used",
        new_column_name="return_refund_requests_used",
    )

    op.add_column(
        "vip_profiles",
        sa.Column(
            "free_listing_credits",
            sa.Integer(),
            nullable=False,
            server_default="0",
        ),
    )

    op.add_column(
        "vip_profiles",
        sa.Column(
            "tier1_membership_paid_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "vip_profiles",
        sa.Column(
            "tier2_membership_paid_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )

    op.add_column(
        "vip_profiles",
        sa.Column(
            "tier2_qualified_by_purchase_at",
            sa.DateTime(timezone=True),
            nullable=True,
        ),
    )


def downgrade() -> None:
    op.drop_column(
        "vip_profiles",
        "tier2_qualified_by_purchase_at",
    )

    op.drop_column(
        "vip_profiles",
        "tier2_membership_paid_at",
    )

    op.drop_column(
        "vip_profiles",
        "tier1_membership_paid_at",
    )

    op.drop_column(
        "vip_profiles",
        "free_listing_credits",
    )

    op.alter_column(
        "vip_profiles",
        "return_refund_requests_used",
        new_column_name="returns_used",
    )

    op.alter_column(
        "vip_profiles",
        "tier1_last_purchase_at",
        new_column_name="last_purchase_at",
    )

    op.alter_column(
        "vip_profiles",
        "listings_completed_count",
        new_column_name="listings_completed",
    )

    op.alter_column(
        "vip_profiles",
        "item_view_count",
        new_column_name="verified_view_count",
    )