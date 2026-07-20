import uuid

from pydantic import BaseModel


class WatchlistRequest(BaseModel):
    property_id: uuid.UUID
