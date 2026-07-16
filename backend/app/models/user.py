import uuid
from datetime import datetime
from enum import StrEnum

from sqlalchemy import DateTime, ForeignKey, String, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.db.base import Base, TimestampMixin, pg_enum
from app.rbac.permissions import Role


class UserStatus(StrEnum):
    PENDING_VERIFICATION = "pending_verification"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    DELETED = "deleted"


class AuthProvider(StrEnum):
    LOCAL = "local"
    ENTRA = "entra"


class User(Base, TimestampMixin):
    __tablename__ = "users"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email: Mapped[str] = mapped_column(String(320), unique=True, index=True)
    password_hash: Mapped[str | None] = mapped_column(String(255), default=None)
    auth_provider: Mapped[AuthProvider] = mapped_column(
        pg_enum(AuthProvider, "auth_provider"), default=AuthProvider.LOCAL
    )
    status: Mapped[UserStatus] = mapped_column(
        pg_enum(UserStatus, "user_status"), default=UserStatus.PENDING_VERIFICATION, index=True
    )
    full_name: Mapped[str] = mapped_column(String(120))
    country: Mapped[str | None] = mapped_column(String(2), default=None)
    business_type: Mapped[str | None] = mapped_column(String(40), default=None)
    email_verified_at: Mapped[datetime | None] = mapped_column(
        DateTime(timezone=True), default=None
    )
    last_login_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)

    role_rows: Mapped[list["UserRole"]] = relationship(
        back_populates="user", cascade="all, delete-orphan", lazy="selectin"
    )

    @property
    def roles(self) -> list[Role]:
        return sorted(row.role for row in self.role_rows)


class UserRole(Base):
    __tablename__ = "user_roles"

    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), primary_key=True
    )
    role: Mapped[Role] = mapped_column(pg_enum(Role, "role"), primary_key=True)

    user: Mapped[User] = relationship(back_populates="role_rows")


class RefreshToken(Base):
    __tablename__ = "refresh_tokens"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id: Mapped[uuid.UUID] = mapped_column(
        ForeignKey("users.id", ondelete="CASCADE"), index=True
    )
    token_hash: Mapped[str] = mapped_column(String(64), unique=True, index=True)
    family_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), index=True)
    expires_at: Mapped[datetime] = mapped_column(DateTime(timezone=True))
    revoked_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True), default=None)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), nullable=False
    )
