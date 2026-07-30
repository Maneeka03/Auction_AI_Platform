"""watchlist status, escrow delivery, saved searches, reviews, tasks"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0014"
down_revision = "0013"
branch_labels = None
depends_on = None

watchlist_status = postgresql.ENUM(
    "watching", "cart", "closed", "delivered", name="watchlist_status", create_type=False
)
task_status = postgresql.ENUM(
    "open", "in_progress", "done", name="task_status", create_type=False
)


def _uuid() -> postgresql.UUID:
    return postgresql.UUID(as_uuid=True)


def upgrade() -> None:
    bind = op.get_bind()
    watchlist_status.create(bind, checkfirst=True)
    task_status.create(bind, checkfirst=True)

    op.add_column(
        "watchlist_items",
        sa.Column("status", watchlist_status, nullable=False, server_default="watching"),
    )
    op.add_column("escrows", sa.Column("delivered_at", sa.DateTime(timezone=True)))

    op.create_table(
        "saved_searches",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("user_id", _uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("name", sa.String(120), nullable=False),
        sa.Column("filters", postgresql.JSONB(), nullable=False, server_default="{}"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_saved_searches_user_id", "saved_searches", ["user_id"])

    op.create_table(
        "reviews",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("author_id", _uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("seller_id", _uuid(), sa.ForeignKey("users.id", ondelete="CASCADE"), nullable=False),
        sa.Column("property_id", _uuid(), sa.ForeignKey("properties.id", ondelete="CASCADE"), nullable=False),
        sa.Column("rating", sa.Integer(), nullable=False),
        sa.Column("body", sa.Text()),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.UniqueConstraint("author_id", "property_id", name="uq_review_author_property"),
    )
    op.create_index("ix_reviews_author_id", "reviews", ["author_id"])
    op.create_index("ix_reviews_seller_id", "reviews", ["seller_id"])
    op.create_index("ix_reviews_property_id", "reviews", ["property_id"])

    op.create_table(
        "tasks",
        sa.Column("id", _uuid(), primary_key=True),
        sa.Column("title", sa.String(200), nullable=False),
        sa.Column("description", sa.Text()),
        sa.Column("status", task_status, nullable=False, server_default="open"),
        sa.Column("assigned_to", _uuid(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("due_date", sa.Date()),
        sa.Column("created_by", _uuid(), sa.ForeignKey("users.id", ondelete="SET NULL")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now(), nullable=False),
    )
    op.create_index("ix_tasks_status", "tasks", ["status"])
    op.create_index("ix_tasks_assigned_to", "tasks", ["assigned_to"])


def downgrade() -> None:
    op.drop_table("tasks")
    op.drop_table("reviews")
    op.drop_table("saved_searches")
    op.drop_column("escrows", "delivered_at")
    op.drop_column("watchlist_items", "status")

    bind = op.get_bind()
    task_status.drop(bind, checkfirst=True)
    watchlist_status.drop(bind, checkfirst=True)
