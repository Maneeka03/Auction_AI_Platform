import uuid
from enum import StrEnum

from sqlalchemy import Boolean, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import JSONB, UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum


class Category(Base, TimestampMixin):
    """What an item is, for any domain the platform auctions - real estate, jewellery, anything.

    Two levels: a main category has `parent_id` null, a subcategory points at one. Nesting deeper is
    refused in the service, so a filter tree is always exactly two deep.
    """

    __tablename__ = "categories"

    __table_args__ = (
        Index(
            "uq_categories_main_slug",
            "slug",
            unique=True,
            postgresql_where=text("parent_id IS NULL"),
        ),
        Index(
            "uq_categories_sub_slug",
            "parent_id",
            "slug",
            unique=True,
            postgresql_where=text("parent_id IS NOT NULL"),
        ),
    )

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name: Mapped[str] = mapped_column(String(120))
    slug: Mapped[str] = mapped_column(String(140))
    parent_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), default=None, index=True
    )

    children: Mapped[list["Category"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    fields: Mapped[list["CategoryField"]] = relationship(
        cascade="all, delete-orphan",
        lazy="selectin",
        order_by="CategoryField.sort_order",
    )


class FieldType(StrEnum):
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    SELECT = "select"
    BOOLEAN = "boolean"
    DATE = "date"
    


class CategoryField(Base, TimestampMixin):
    """A custom input field the admin defines per category. Sellers fill these when listing."""

    __tablename__ = "category_fields"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), index=True
    )
    label: Mapped[str] = mapped_column(String(120))
    field_type: Mapped[FieldType] = mapped_column(pg_enum(FieldType, "category_field_type"))
    options: Mapped[list[str] | None] = mapped_column(JSONB, default=None)
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)
