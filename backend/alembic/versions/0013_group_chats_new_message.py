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
    # Tables were created by the now-missing migrations 0013-0016.
    # The DB column for the creator FK is created_by_id (SQLAlchemy auto-naming convention).
    # We only need to add the missing indexes here.
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


def downgrade() -> None:
    op.drop_table("group_messages")
    op.drop_table("group_chat_members")
    op.drop_table("group_chats")
