from fastapi import APIRouter, Depends

from app.api.deps import CurrentUser, DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module, Role
from app.schemas.agency import UpdateUserBrandingRequest
from app.schemas.settings import BrandingOut, UpdateBrandingRequest
from app.schemas.sidebar import SidebarEntryOut
from app.services import settings, sidebar as sidebar_service, user_branding

router = APIRouter(prefix="/admin/settings", tags=["settings"])

SettingsManager = Depends(requires(Module.SYSTEM_SETTINGS, Access.FULL))

_GLOBAL_DEFAULTS = {"platform_name": "Auction Platform", "primary_color": "#5b45d6"}


async def _personal_branding_out(session, actor_id) -> BrandingOut:
    """Assemble BrandingOut for a super admin: personal values, falling back to global."""
    personal = await user_branding.get(session, actor_id)
    global_b = await settings.get_branding(session)
    p_name = personal.platform_name if personal else None
    p_logo = personal.logo_url if personal else None
    p_color = personal.primary_color if personal else None
    return BrandingOut(
        platform_name=p_name or global_b.platform_name,
        logo_url=p_logo if p_logo is not None else global_b.logo_url,
        primary_color=p_color or global_b.primary_color,
    )


@router.get("/branding", response_model=BrandingOut)
async def get_branding(session: DbSession, actor: User = SettingsManager) -> BrandingOut:
    """Super admins get their personal branding; agency admin gets the global platform branding."""
    if Role.SUPER_ADMIN in actor.roles:
        return await _personal_branding_out(session, actor.id)
    return await settings.get_branding(session)


@router.patch("/branding", response_model=BrandingOut)
async def update_branding(
    payload: UpdateBrandingRequest,
    session: DbSession,
    actor: User = SettingsManager,
) -> BrandingOut:
    """Super admins patch their own personal branding row; agency admin patches the global record."""
    if Role.SUPER_ADMIN in actor.roles:
        updates = payload.model_dump(exclude_unset=True)
        current = await user_branding.get(session, actor.id)
        await user_branding.upsert(
            session,
            actor.id,
            UpdateUserBrandingRequest(
                platform_name=updates.get("platform_name", current.platform_name if current else None),
                logo_url=updates.get("logo_url", current.logo_url if current else None),
                primary_color=updates.get("primary_color", current.primary_color if current else None),
            ),
        )
        return await _personal_branding_out(session, actor.id)
    return await settings.update_branding(session, actor.id, payload)


@router.get("/sidebar", response_model=list[SidebarEntryOut])
async def get_effective_sidebar(session: DbSession, actor: CurrentUser) -> list[SidebarEntryOut]:
    """Returns the logged-in user's personal sidebar config (set by the agency admin for them)."""
    rows = await sidebar_service.config(session, actor.id)
    return [
        SidebarEntryOut(item_id=row[0], key=row[1], label=row[2], visible=row[3], position=row[4])
        for row in rows
    ]
