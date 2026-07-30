from fastapi import APIRouter

from app.api.v1 import (
    admin,
    agency,
    auction_requests,
    auctions,
    auth,
    buyer,
    campaigns,
    categories,
    crm,
    dev,
    escrow,
    groups,
    kyc,
    me,
    messages,
    notifications,
    properties,
    push,
    reports,
    reviews,
    saved_searches,
    seller,
    tasks,
    uploads,
    users,
    wallet,
    watchlist,
)
from app.core.config import settings

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)
api_router.include_router(categories.router)
api_router.include_router(properties.router)
api_router.include_router(auctions.router)
api_router.include_router(wallet.router)
api_router.include_router(notifications.router)
api_router.include_router(push.router)
api_router.include_router(reports.router)
api_router.include_router(uploads.router)
api_router.include_router(kyc.router)
api_router.include_router(watchlist.router)
api_router.include_router(me.router)
api_router.include_router(messages.router)
api_router.include_router(groups.router)
api_router.include_router(crm.router)
api_router.include_router(campaigns.router)
api_router.include_router(escrow.router)
api_router.include_router(agency.router)
api_router.include_router(buyer.router)
api_router.include_router(seller.router)
api_router.include_router(saved_searches.router)
api_router.include_router(reviews.router)
api_router.include_router(tasks.router)
api_router.include_router(auction_requests.router)
api_router.include_router(admin.router)

if not settings.is_production:
    api_router.include_router(dev.router)
