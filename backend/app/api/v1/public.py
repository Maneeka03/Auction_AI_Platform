import uuid

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.session import get_session
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.schemas.category import CategoryOut, CategoryTreeOut
from app.schemas.settings import BrandingOut
from app.services import agency, categories, settings, user_branding

router = APIRouter(tags=["public"])


@router.get("/branding", response_model=BrandingOut)
async def get_branding_public(
    session: AsyncSession = Depends(get_session),
) -> BrandingOut:
    """Global platform branding — no auth required."""
    return await settings.get_branding(session)


class TenantPublicOut(BaseModel):
    id: uuid.UUID
    slug: str
    platform_name: str
    logo_url: str | None
    primary_color: str


@router.get("/t/{slug}", response_model=TenantPublicOut)
async def get_tenant_by_slug(
    slug: str,
    session: AsyncSession = Depends(get_session),
) -> TenantPublicOut:
    super_admin = await agency.get_by_slug(session, slug)
    global_b = await settings.get_branding(session)
    personal = await user_branding.get(session, super_admin.id)

    return TenantPublicOut(
        id=super_admin.id,
        slug=slug,
        platform_name=(personal.platform_name if personal else None) or global_b.platform_name,
        logo_url=(personal.logo_url if personal else None) if personal else global_b.logo_url,
        primary_color=(personal.primary_color if personal else None) or global_b.primary_color,
    )


class TenantDiscoverOut(BaseModel):
    id: uuid.UUID
    slug: str
    platform_name: str
    logo_url: str | None
    primary_color: str
    categories: list[CategoryTreeOut]


@router.get("/discover", response_model=list[TenantDiscoverOut])
async def discover_tenants(
    session: AsyncSession = Depends(get_session),
) -> list[TenantDiscoverOut]:
    """All active super admins with their category trees — powers the marketplace discovery page."""
    global_b = await settings.get_branding(session)

    # Load all active super admins
    rows = await session.scalars(
        select(User)
        .where(
            User.status == UserStatus.ACTIVE,
            User.role_rows.any(UserRole.role == Role.SUPER_ADMIN),
            User.slug.is_not(None),
        )
        .order_by(User.full_name)
    )
    tenants = list(rows)

    # Load all categories grouped by tenant_id in one query
    cats_by_tenant = await categories.tree_all_tenants(session)

    result: list[TenantDiscoverOut] = []
    for tenant in tenants:
        personal = await user_branding.get(session, tenant.id)
        result.append(
            TenantDiscoverOut(
                id=tenant.id,
                slug=tenant.slug,
                platform_name=(personal.platform_name if personal else None) or global_b.platform_name,
                logo_url=(personal.logo_url if personal else None) if personal else global_b.logo_url,
                primary_color=(personal.primary_color if personal else None) or global_b.primary_color,
                categories=[
                    CategoryTreeOut.model_validate(c)
                    for c in cats_by_tenant.get(tenant.id, [])
                ],
            )
        )

    return result
