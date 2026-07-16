from fastapi import APIRouter

from app.api.v1 import auth, dev, users
from app.core.config import settings

api_router = APIRouter(prefix="/api/v1")
api_router.include_router(auth.router)
api_router.include_router(users.router)

if not settings.is_production:
    api_router.include_router(dev.router)
