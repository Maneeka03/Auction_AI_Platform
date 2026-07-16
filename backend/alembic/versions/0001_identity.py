"""identity: users, roles, refresh tokens"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0001"
down_revision = None
branch_labels = None
depends_on = None

user_status = postgresql.ENUM(
    "pending_verification",
    "active",
    "suspended",
    "deleted",
    name="user_status",
    create_type=False,
)
auth_provider = postgresql.ENUM("local", "entra", name="auth_provider", create_type=False)
role = postgresql.ENUM(
    "super_admin",
    "auction_manager",
    "marketing",
    "legal",
    "finance",
    "gemologist",
    "buyer",
    "seller",
    "executive",
    name="role",
    create_type=False,
)


def upgrade() -> None:
    bind = op.get_bind()
    user_status.create(bind, checkfirst=True)
    auth_provider.create(bind, checkfirst=True)
    role.create(bind, checkfirst=True)

    op.create_table(
        "users",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column("email", sa.String(320), nullable=False, unique=True),
        sa.Column("password_hash", sa.String(255)),
        sa.Column("auth_provider", auth_provider, nullable=False, server_default="local"),
        sa.Column("status", user_status, nullable=False, server_default="pending_verification"),
        sa.Column("full_name", sa.String(120), nullable=False),
        sa.Column("country", sa.String(2)),
        sa.Column("business_type", sa.String(40)),
        sa.Column("email_verified_at", sa.DateTime(timezone=True)),
        sa.Column("last_login_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_users_email", "users", ["email"], unique=True)
    op.create_index("ix_users_status", "users", ["status"])

    op.create_table(
        "user_roles",
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            primary_key=True,
        ),
        sa.Column("role", role, primary_key=True),
    )

    op.create_table(
        "refresh_tokens",
        sa.Column("id", postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column(
            "user_id",
            postgresql.UUID(as_uuid=True),
            sa.ForeignKey("users.id", ondelete="CASCADE"),
            nullable=False,
        ),
        sa.Column("token_hash", sa.String(64), nullable=False, unique=True),
        sa.Column("family_id", postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column("expires_at", sa.DateTime(timezone=True), nullable=False),
        sa.Column("revoked_at", sa.DateTime(timezone=True)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.func.now()),
    )
    op.create_index("ix_refresh_tokens_user_id", "refresh_tokens", ["user_id"])
    op.create_index("ix_refresh_tokens_token_hash", "refresh_tokens", ["token_hash"], unique=True)
    op.create_index("ix_refresh_tokens_family_id", "refresh_tokens", ["family_id"])


def downgrade() -> None:
    op.drop_table("refresh_tokens")
    op.drop_table("user_roles")
    op.drop_table("users")
    bind = op.get_bind()
    role.drop(bind, checkfirst=True)
    auth_provider.drop(bind, checkfirst=True)
    user_status.drop(bind, checkfirst=True)
