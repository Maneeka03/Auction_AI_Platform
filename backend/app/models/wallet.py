import uuid
from decimal import Decimal

from sqlalchemy import ForeignKey, Numeric
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base, TimestampMixin


class Wallet(Base, TimestampMixin):
    __tablename__ = "wallets"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), unique=True, index=True
    )
    # Money the user has paid in and not yet lost to a won auction. Funds locked by live bids are
    # NOT subtracted here - they are derived from the bids table, so a losing bid frees itself the
    # moment its auction ends. See services/wallets.held.
    balance: Mapped[Decimal] = mapped_column(Numeric(12, 2), default=Decimal(0))
