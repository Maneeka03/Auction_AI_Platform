import uuid

from fastapi import APIRouter, Query

from app.api.deps import CurrentUser, DbSession
from app.schemas.portal import BuyerDashboardOut, PurchaseOut
from app.schemas.property import PropertyOut
from app.services import escrow, portal, properties

router = APIRouter(prefix="/me", tags=["buyer-portal"])


@router.get("/dashboard", response_model=BuyerDashboardOut)
async def buyer_dashboard(session: DbSession, actor: CurrentUser) -> BuyerDashboardOut:
    return await portal.buyer_dashboard(session, actor.id)


@router.get("/recommendations", response_model=list[PropertyOut])
async def recommendations(
    session: DbSession, actor: CurrentUser, limit: int = Query(12, ge=1, le=50)
) -> list[PropertyOut]:
    items = await properties.recommended_for(session, actor.id, limit)
    return [PropertyOut.of(item) for item in items]


@router.get("/purchases", response_model=list[PurchaseOut])
async def purchases(session: DbSession, actor: CurrentUser) -> list[PurchaseOut]:
    return [PurchaseOut.of(item) for item in await escrow.for_buyer(session, actor.id)]


@router.patch("/purchases/{escrow_id}/delivery", response_model=PurchaseOut)
async def confirm_delivery(
    escrow_id: uuid.UUID, session: DbSession, actor: CurrentUser
) -> PurchaseOut:
    return PurchaseOut.of(await escrow.mark_delivered(session, escrow_id, actor.id))
