import uuid

from sqlalchemy import ForeignKey, Index, String, text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin


class Category(Base, TimestampMixin):
    """Two-level category tree scoped to a super-admin tenant.

    Main categories have parent_id=None; subcategories point at a main category.
    The tree is enforced to be exactly two levels deep in the service layer.
    """

    __tablename__ = "categories"

    __table_args__ = (
        # Same slug allowed across tenants; unique within a tenant at each level
        Index(
            "uq_categories_main_tenant_slug",
            "tenant_id",
            "slug",
            unique=True,
            postgresql_where=text("parent_id IS NULL"),
        ),
        Index(
            "uq_categories_sub_tenant_slug",
            "tenant_id",
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
    tenant_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None, index=True
    )

    children: Mapped[list["Category"]] = relationship(cascade="all, delete-orphan", lazy="selectin")
