from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel

from app.models.property import PropertyCategory


class CategoryCount(BaseModel):
    category: PropertyCategory
    count: int


class WeeklyCount(BaseModel):
    week: datetime
    count: int


class MonthlyAmount(BaseModel):
    month: datetime
    amount: Decimal


class RevenueOut(BaseModel):
    total_revenue: Decimal
    auction_revenue: Decimal
    direct_sales_revenue: Decimal
    sales_count: int
    monthly: list[MonthlyAmount]


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
