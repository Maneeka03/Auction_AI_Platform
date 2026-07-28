from fastapi import APIRouter, Depends

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.report import AuctionActivityOut, DashboardOut, RevenueOut
from app.services import reports

router = APIRouter(prefix="/reports", tags=["reports"])

Viewer = Depends(requires(Module.REPORTS, Access.VIEW))


@router.get("/dashboard", response_model=DashboardOut)
async def dashboard(session: DbSession, _: User = Viewer) -> DashboardOut:
    return await reports.dashboard(session)


@router.get("/revenue", response_model=RevenueOut)
async def revenue(session: DbSession, _: User = Viewer) -> RevenueOut:
    return await reports.revenue(session)


@router.get("/auction-activity", response_model=AuctionActivityOut)
async def auction_activity(session: DbSession, _: User = Viewer) -> AuctionActivityOut:
    return await reports.auction_activity(session)
