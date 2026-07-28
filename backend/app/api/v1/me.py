from fastapi import APIRouter, status

from pydantic import BaseModel

from app.api.deps import CurrentUser, DbSession
from app.core.errors import AppError
from app.rbac.permissions import Role
from app.schemas.auction import AuctionOut
from app.schemas.auth import Session
from app.schemas.bid import MyBidOut
from app.schemas.property import PropertyOut
from app.schemas.settings import BrandingOut
from app.services import agency, auctions, properties, settings as settings_service, user_branding

router = APIRouter(prefix="/users/me", tags=["me"])


async def _resolve_branding(session, tenant_id) -> BrandingOut:
    """Return a super admin's personal branding, falling back to global for unset fields."""
    personal = await user_branding.get(session, tenant_id)
    global_b = await settings_service.get_branding(session)
    return BrandingOut(
        platform_name=(personal.platform_name if personal else None) or global_b.platform_name,
        logo_url=(personal.logo_url if personal else None) if personal else global_b.logo_url,
        primary_color=(personal.primary_color if personal else None) or global_b.primary_color,
    )


@router.get("/branding", response_model=BrandingOut)
async def my_branding(session: DbSession, actor: CurrentUser) -> BrandingOut:
    """Returns the branding the current user should see.

    - super_admin       → their own personal branding
    - buyer/seller/staff with tenant_id → their super admin's branding
    - agency_admin / no tenant → global platform branding
    """
    if Role.SUPER_ADMIN in actor.roles:
        return await _resolve_branding(session, actor.id)
    if actor.tenant_id is not None:
        return await _resolve_branding(session, actor.tenant_id)
    return await settings_service.get_branding(session)


@router.get("/bids", response_model=list[MyBidOut])
async def my_bids(session: DbSession, actor: CurrentUser) -> list[MyBidOut]:
    rows = await auctions.by_bidder(session, actor.id)
    return [MyBidOut.of(row, my_bid, actor.id) for row, my_bid in rows]


@router.get("/auction-invites", response_model=list[AuctionOut])
async def my_auction_invites(session: DbSession, actor: CurrentUser) -> list[AuctionOut]:
    return [AuctionOut.of(*row) for row in await auctions.invited(session, actor.id)]


@router.get("/properties", response_model=list[PropertyOut])
async def my_properties(session: DbSession, actor: CurrentUser) -> list[PropertyOut]:
    return [PropertyOut.of(item) for item in await properties.by_seller(session, actor.id)]


class JoinTenantRequest(BaseModel):
    slug: str


@router.post("/tenant", response_model=Session, status_code=status.HTTP_200_OK)
async def join_tenant(
    payload: JoinTenantRequest, session: DbSession, actor: CurrentUser
) -> Session:
    """Assign a buyer or seller to a super admin's platform (tenant).

    Only buyers/sellers without an existing tenant may call this.
    Super admins and agency admins are rejected.
    """
    if Role.SUPER_ADMIN in actor.roles or Role.AGENCY_ADMIN in actor.roles:
        raise AppError(
            status.HTTP_403_FORBIDDEN, "forbidden", "Admins cannot join a tenant."
        )
    super_admin = await agency.get_by_slug(session, payload.slug)
    actor.tenant_id = super_admin.id
    await session.commit()
    await session.refresh(actor)
    return Session.of(actor)
