import asyncio
import os
from datetime import UTC, datetime

from app.core.security import hash_password
from app.db.session import SessionFactory
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.services.auth import get_by_email


async def main() -> None:
    email = os.environ["BOOTSTRAP_EMAIL"].strip().lower()
    password = os.environ["BOOTSTRAP_PASSWORD"]
    full_name = os.environ.get("BOOTSTRAP_NAME", "Super Admin")

    async with SessionFactory() as session:
        if await get_by_email(session, email):
            print(f"{email} already exists")
            return
        session.add(
            User(
                email=email,
                password_hash=hash_password(password),
                full_name=full_name,
                status=UserStatus.ACTIVE,
                email_verified_at=datetime.now(UTC),
                role_rows=[UserRole(role=Role.SUPER_ADMIN)],
            )
        )
        await session.commit()
        print(f"super admin created: {email}")


if __name__ == "__main__":
    asyncio.run(main())
