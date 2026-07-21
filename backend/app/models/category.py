import uuid

from sqlalchemy import ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


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

    children: Mapped[list["Category"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
