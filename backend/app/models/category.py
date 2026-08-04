import uuid
from enum import StrEnum

from sqlalchemy import JSON, Boolean, ForeignKey, Index, Integer, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum


class CategoryFieldType(StrEnum):
    """The input a category field renders as on the listing form."""

    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    SELECT = "select"
    BOOLEAN = "boolean"
    DATE = "date"


class Category(Base, TimestampMixin):
    """What an item is, for any domain the platform auctions - real estate, jewellery, anything.

    Two levels: a main category has `parent_id` null, a subcategory points at one. Nesting deeper is
    refused in the service, so a filter tree is always exactly two deep.
    """

    __tablename__ = "categories"

    # A name only has to be unique among its siblings, so "Antique" can sit under both Jewellery and
    # Furniture. Two partial indexes rather than one on (parent_id, slug): in a plain unique index
    # NULLs compare as distinct, which would let duplicate main categories through.
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
    # A display-only header grouping main categories on the UI (e.g. "Vehicles & Transportation").
    group_label: Mapped[str | None] = mapped_column(String(120), default=None)

    children: Mapped[list["Category"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
    # Custom fields the seller fills for a listing in this category. Attached at the main level;
    # subcategories inherit their parent's fields, so only main categories carry rows here.
    fields: Mapped[list["CategoryField"]] = relationship(
        cascade="all, delete-orphan", lazy="selectin", order_by="CategoryField.sort_order"
    )


class CategoryField(Base):
    """One custom field defined on a category, rendered on the listing form by `field_type`."""

    __tablename__ = "category_fields"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    category_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("categories.id", ondelete="CASCADE"), index=True
    )
    label: Mapped[str] = mapped_column(String(120))
    # Slug of the label; the key under which the seller's value is stored in Property.attributes.
    field_key: Mapped[str] = mapped_column(String(140))
    field_type: Mapped[CategoryFieldType] = mapped_column(
        pg_enum(CategoryFieldType, "category_field_type")
    )
    # Choices for a SELECT field; null for every other type.
    options: Mapped[list[str] | None] = mapped_column(JSON, default=None)
    unit: Mapped[str | None] = mapped_column(String(40), default=None)
    required: Mapped[bool] = mapped_column(Boolean, default=False)
    sort_order: Mapped[int] = mapped_column(Integer, default=0)

