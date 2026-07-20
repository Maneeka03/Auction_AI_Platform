import uuid
from collections.abc import Iterable
from datetime import datetime
from decimal import Decimal
from enum import StrEnum

from sqlalchemy import Boolean, DateTime, ForeignKey, Integer, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.models.user import User
from app.rbac.permissions import Role


class PropertyCategory(StrEnum):
    RESIDENTIAL = "residential"
    COMMERCIAL = "commercial"


class PropertyStatus(StrEnum):
    DRAFT = "draft"
    PUBLISHED = "published"
    SOLD = "sold"
    REJECTED = "rejected"


class PaymentMethod(StrEnum):
    TOKEN = "token"  # noqa: S105  (a deposit, not a credential)
    FULL = "full"


class ApproverRole(StrEnum):
    """The three seats of the client's 2-of-3 sign-off, named as the client names them."""

    DIRECTOR = "director"
    APPRAISER = "appraiser"
    LEGAL_FINANCE = "legal_finance"


# Which platform role fills each seat. The client calls the gemologist an appraiser, and treats
# legal and finance as one auditor representative.
SEAT_HOLDERS: dict[ApproverRole, frozenset[Role]] = {
    ApproverRole.DIRECTOR: frozenset({Role.SUPER_ADMIN}),
    ApproverRole.APPRAISER: frozenset({Role.GEMOLOGIST}),
    ApproverRole.LEGAL_FINANCE: frozenset({Role.LEGAL, Role.FINANCE}),
}

# 2 of the 3 seats carry a decision either way.
QUORUM = 2


def seat_of(roles: Iterable[Role]) -> ApproverRole | None:
    held = set(roles)
    return next((seat for seat, fillers in SEAT_HOLDERS.items() if held & fillers), None)


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
    # Coordinates for map/radius search. Null until geocoded or set by the lister.
    latitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), default=None)
    longitude: Mapped[Decimal | None] = mapped_column(Numeric(9, 6), default=None)
    seller_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None, index=True
    )

    # Set by a direct Buy Now. A property won at auction is marked sold by the award instead, and
    # leaves these null - auction winners are read from Auction.winner_id.
    buyer_id: Mapped[uuid.UUID | None] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"), default=None
    )
    payment_method: Mapped[PaymentMethod | None] = mapped_column(
        pg_enum(PaymentMethod, "payment_method"), default=None
    )
    paid_amount: Mapped[Decimal | None] = mapped_column(Numeric(12, 2), default=None)
    purchased_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    # Lets a listing carry its seller's name inline, so an approvals queue never shows a bare UUID.
    seller: Mapped[User | None] = relationship(lazy="selectin", foreign_keys=seller_id)
    votes: Mapped[list["PropertyVote"]] = relationship(
        back_populates="listing", cascade="all, delete-orphan", lazy="selectin"
    )


class PropertyVote(Base):
    """One seat's decision on a listing. The primary key is what makes a seat vote only once."""

    __tablename__ = "property_votes"

    property_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("properties.id", ondelete="CASCADE"), primary_key=True
    )
    seat: Mapped[ApproverRole] = mapped_column(
        pg_enum(ApproverRole, "approver_role"), primary_key=True
    )
    voter_id: Mapped[uuid.UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    approved: Mapped[bool] = mapped_column(Boolean)
    decided_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )

    listing: Mapped[Property] = relationship(back_populates="votes")
    voter: Mapped[User] = relationship(lazy="selectin")
