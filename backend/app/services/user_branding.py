import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.user_branding import UserBranding
from app.schemas.agency import UpdateUserBrandingRequest, UserBrandingOut


async def get(session: AsyncSession, user_id: uuid.UUID) -> UserBrandingOut | None:
    row = await session.get(UserBranding, user_id)
    if row is None:
        return None
    return UserBrandingOut(
        platform_name=row.platform_name,
        logo_url=row.logo_url,
        primary_color=row.primary_color,
    )


async def upsert(
    session: AsyncSession, user_id: uuid.UUID, data: UpdateUserBrandingRequest
) -> UserBrandingOut:
    stmt = (
        insert(UserBranding)
        .values(
            user_id=user_id,
            platform_name=data.platform_name,
            logo_url=data.logo_url,
            primary_color=data.primary_color,
        )
        .on_conflict_do_update(
            index_elements=["user_id"],
            set_={
                "platform_name": data.platform_name,
                "logo_url": data.logo_url,
                "primary_color": data.primary_color,
            },
        )
    )
    await session.execute(stmt)
    await session.commit()
    row = await session.get(UserBranding, user_id)
    return UserBrandingOut(
        platform_name=row.platform_name if row else None,
        logo_url=row.logo_url if row else None,
        primary_color=row.primary_color if row else None,
    )
