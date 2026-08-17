"""group chats"""

import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

from alembic import op

revision = "0013"
# DB was advanced to 0017 on a prior branch whose files were never committed.
# This migration sits at the head of the surviving chain.
down_revision = "0017"
branch_labels = None
depends_on = None


def upgrade() -> None:
    # These tables were only ever created by migrations 0013-0016 that were applied directly to
    # the client's DB but whose files were never committed to this repo - so on any fresh database
    # (a new dev machine, CI, a clean deploy) they don't exist yet. Create them here from the
    # current models (app/models/messaging.py) if missing, so `alembic upgrade head` works from
    # zero. This is a no-op against a DB that already has them from the original, uncommitted
    # migrations.
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS group_chats (
            id UUID PRIMARY KEY,
            name VARCHAR(120) NOT NULL,
            created_by_id UUID REFERENCES users(id) ON DELETE SET NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS group_chat_members (
            group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
            user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            joined_at TIMESTAMPTZ NOT NULL DEFAULT now(),
            PRIMARY KEY (group_id, user_id)
        )
        """
    )
    op.execute(
        """
        CREATE TABLE IF NOT EXISTS group_messages (
            id UUID PRIMARY KEY,
            group_id UUID NOT NULL REFERENCES group_chats(id) ON DELETE CASCADE,
            sender_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
            body VARCHAR(2000) NOT NULL,
            created_at TIMESTAMPTZ NOT NULL DEFAULT now()
        )
        """
    )

    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_group_chats_created_by_id"
        " ON group_chats (created_by_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_group_chat_members_user_id"
        " ON group_chat_members (user_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_group_messages_sender_id"
        " ON group_messages (sender_id)"
    )
    op.execute(
        "CREATE INDEX IF NOT EXISTS ix_group_messages_group_id"
        " ON group_messages (group_id)"
    )


def downgrade() -> None:
    op.drop_table("group_messages")
    op.drop_table("group_chat_members")
    op.drop_table("group_chats")
