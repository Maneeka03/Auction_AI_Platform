# import uuid
# from datetime import datetime
# from enum import StrEnum

# from sqlalchemy import DateTime, ForeignKey, String, Text, func
# from sqlalchemy.dialects.postgresql import UUID
# from sqlalchemy.orm import Mapped, mapped_column, relationship

# from app.db.base import Base, pg_enum
# from app.models.user import User

# from sqlalchemy.dialects.postgresql import JSONB, UUID

# class CategoryRequestStatus(StrEnum):
#     PENDING = "pending"
#     APPROVED = "approved"
#     REJECTED = "rejected"


# class CategoryRequest(Base):
#     __tablename__ = "category_requests"

#     id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True), primary_key=True, default=uuid.uuid4
#     )

#     seller_id: Mapped[uuid.UUID] = mapped_column(
#         UUID(as_uuid=True),
#         ForeignKey("users.id", ondelete="CASCADE"),
#         nullable=False,
#     )

#     name: Mapped[str] = mapped_column(String(120), nullable=False)

#     parent_id: Mapped[uuid.UUID | None] = mapped_column(
#         UUID(as_uuid=True),
#         ForeignKey("categories.id", ondelete="SET NULL"),
#         nullable=True,
#     )

#     status: Mapped[CategoryRequestStatus] = mapped_column(
#         pg_enum(CategoryRequestStatus, name="category_request_status"),
#         nullable=False,
#         default=CategoryRequestStatus.PENDING,
#     )

#     admin_note: Mapped[str | None] = mapped_column(Text, nullable=True)

#     reviewed_by: Mapped[uuid.UUID | None] = mapped_column(
#         UUID(as_uuid=True),
#         ForeignKey("users.id", ondelete="SET NULL"),
#         nullable=True,
#     )

#     reviewed_at: Mapped[datetime | None] = mapped_column(
#         DateTime(timezone=True), nullable=True
#     )

#     created_at: Mapped[datetime] = mapped_column(
#         DateTime(timezone=True),
#         server_default=func.now(),
#         nullable=False,
#     )

#     updated_at: Mapped[datetime] = mapped_column(
#         DateTime(timezone=True),
#         server_default=func.now(),
#         onupdate=func.now(),
#         nullable=False,
#     )

#     seller: Mapped[User] = relationship(
#         "User",
#         foreign_keys=[seller_id],
#         lazy="selectin",
#     )

#     reviewer: Mapped[User | None] = relationship(
#         "User",
#         foreign_keys=[reviewed_by],
#         lazy="selectin",
#     )
    
#     subcategories: Mapped[list[str]] = mapped_column(
#     JSONB,
#     nullable=False,
#     default=list,
# )

# fields: Mapped[list[dict]] = mapped_column(
#     JSONB,
#     nullable=False,
#     default=list,
# )