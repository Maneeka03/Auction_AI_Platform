import uuid
from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel


class CategoryCount(BaseModel):
    category: str
    count: int


class WeeklyCount(BaseModel):
    week: datetime
    count: int


class MonthlyRevenueDetail(BaseModel):
    month: datetime
    amount: Decimal
    auction_amount: Decimal
    direct_amount: Decimal
    sales_count: int


class RevenueOut(BaseModel):
    total_revenue: Decimal
    auction_revenue: Decimal
    direct_sales_revenue: Decimal
    sales_count: int
    monthly: list[MonthlyRevenueDetail]


class AuctionActivityOut(BaseModel):
    total: int
    upcoming: int
    live: int
    ended: int
    awarded: int
    total_bids: int
    weekly: list[WeeklyCount]


class DashboardOut(BaseModel):
    total_buyers: int
    total_sellers: int
    active_auctions: int
    total_listings: int
    published_listings: int
    sold_listings: int
    pending_approvals: int
    total_revenue: Decimal
    category_mix: list[CategoryCount]
    weekly_signups: list[WeeklyCount]


class SellerPerformance(BaseModel):
    seller_id: uuid.UUID
    seller_name: str
    listings: int
    sold: int
    avg_sale_price: Decimal
    success_rate: float


class BuyerActivity(BaseModel):
    buyer_id: uuid.UUID
    buyer_name: str
    bids: int
    won: int
    avg_spend: Decimal


class MarketingPerformanceOut(BaseModel):
    total: int
    sent: int
    scheduled: int
    draft: int


class BestSeller(BaseModel):
    property_id: uuid.UUID
    title: str
    final_price: Decimal
    bid_count: int


class AiInsightsOut(BaseModel):
    summary: str
    highlights: list[str]


class ConversionRatesOut(BaseModel):
    lead_to_buyer: float
    browse_to_bid: float
    bid_to_win: float