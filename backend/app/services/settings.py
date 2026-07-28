import uuid

from sqlalchemy import select
from sqlalchemy.dialects.postgresql import insert
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.setting import PlatformSetting
from app.schemas.settings import BrandingOut, UpdateBrandingRequest

_BRANDING_KEYS = {"platform_name", "logo_url", "primary_color"}
_BRANDING_DEFAULTS: dict[str, str | None] = {
    "platform_name": "Auction Platform",
    "logo_url": None,
    "primary_color": "#5b45d6",
}


async def get_branding(session: AsyncSession) -> BrandingOut:
    rows = await session.execute(
        select(PlatformSetting).where(PlatformSetting.key.in_(list(_BRANDING_KEYS)))
    )
    stored = {row.key: row.value for row in rows.scalars()}
    return BrandingOut(
        platform_name=stored.get("platform_name") or _BRANDING_DEFAULTS["platform_name"],
        logo_url=stored.get("logo_url"),
        primary_color=stored.get("primary_color") or _BRANDING_DEFAULTS["primary_color"],
    )


async def update_branding(
    session: AsyncSession,
    actor_id: uuid.UUID,
    data: UpdateBrandingRequest,
) -> BrandingOut:
    updates = data.model_dump(exclude_unset=True)
    if not updates:
        return await get_branding(session)

    for key, value in updates.items():
        stmt = (
            insert(PlatformSetting)
            .values(key=key, value=value, updated_by_id=actor_id)
            .on_conflict_do_update(
                index_elements=["key"],
                set_={"value": value, "updated_by_id": actor_id},
            )
        )
        await session.execute(stmt)

    await session.commit()
    return await get_branding(session)
