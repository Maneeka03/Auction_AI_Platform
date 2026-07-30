import uuid

from pydantic import BaseModel

from app.models.watchlist import WatchlistItem, WatchlistStatus
from app.schemas.property import PropertyOut


class WatchlistRequest(BaseModel):
    property_id: uuid.UUID


class WatchlistStatusUpdate(BaseModel):
    status: WatchlistStatus


class WatchlistItemOut(BaseModel):
    status: WatchlistStatus
    property: PropertyOut

    @classmethod
    def of(cls, item: WatchlistItem, listing) -> "WatchlistItemOut":
        return cls(status=item.status, property=PropertyOut.of(listing))
