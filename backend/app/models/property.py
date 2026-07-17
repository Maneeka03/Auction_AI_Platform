import uuid
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.user import User


class PropertyCategory(StrEnum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"


class PropertyStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SOLD = "sold"


class Property(Base, TimestampMixin):
    __tablename__ = "properties"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200))
    address: Mapped[str] = mapped_column(String(300))
    category: Mapped[PropertyCategory] = mapped_column(
        pg_enum(PropertyCategory, "property_category")
    )
    status: Mapped[PropertyStatus] = mapped_column(
        pg_enum(PropertyStatus, "property_status"), default=PropertyStatus.DRAFT, index=True
    )
    description: Mapped[str | None] = mapped_column(Text, default=None)
    image_url: Mapped[str | None] = mapped_column(String(500), default=None)
    reserve_price: Mapped[Decimal] = mapped_column(Numeric(12, 2))
    # Residential detail. Null on commercial lots, where they do not apply. Half-baths are not
    # modelled - bathrooms is a whole count.
    bedrooms: Mapped[int | None] = mapped_column(Integer, default=None)
    bathrooms: Mapped[int | None] = mapped_column(Integer, default=None)
    area_sqft: Mapped[int | None] = mapped_column(Integer, default=None)
    seller_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None, index=True
    )

    # Lets a listing carry its seller's name inline, so an approvals queue never shows a bare UUID.
    seller: Mapped[User | None] = relationship(lazy="selectin")
