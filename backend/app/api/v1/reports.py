from fastapi import APIRouter, Depends, Query

from app.api.deps import DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.report import (
    AiInsightsOut,
    AuctionActivityOut,
    BestSeller,
    BuyerActivity,
    ConversionRatesOut,
    DashboardOut,
    MarketingPerformanceOut,
    RevenueOut,
    SellerPerformance,
)
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


@router.get("/seller-performance", response_model=list[SellerPerformance])
async def seller_performance(session: DbSession, _: User = Viewer) -> list[SellerPerformance]:
    return await reports.seller_performance(session)


@router.get("/buyer-activity", response_model=list[BuyerActivity])
async def buyer_activity(session: DbSession, _: User = Viewer) -> list[BuyerActivity]:
    return await reports.buyer_activity(session)


@router.get("/marketing-performance", response_model=MarketingPerformanceOut)
async def marketing_performance(session: DbSession, _: User = Viewer) -> MarketingPerformanceOut:
    return await reports.marketing_performance(session)


@router.get("/best-sellers", response_model=list[BestSeller])
async def best_sellers(
    session: DbSession, limit: int = Query(10, ge=1, le=50), _: User = Viewer
) -> list[BestSeller]:
    return await reports.best_sellers(session, limit)


@router.get("/ai-insights", response_model=AiInsightsOut)
async def ai_insights(session: DbSession, _: User = Viewer) -> AiInsightsOut:
    return await reports.ai_insights(session)


@router.get("/conversion-rates", response_model=ConversionRatesOut)
async def conversion_rates(session: DbSession, _: User = Viewer) -> ConversionRatesOut:
    return await reports.conversion_rates(session)
