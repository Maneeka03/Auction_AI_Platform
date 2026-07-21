from typing import Literal

from pydantic import BaseModel

from app.services.uploads import ALLOWED_TYPES

ContentType = Literal["image/jpeg", "image/png", "image/webp", "image/avif", "application/pdf"]

# Keeps the Literal above honest against the extension map the service actually uses: adding one
# without the other would only fail later, on an upload.
assert set(ContentType.__args__) == set(ALLOWED_TYPES)


class PresignRequest(BaseModel):
    content_type: ContentType
    # Where the object belongs. Listing photos are readable by anyone with the URL; identity
    # documents live behind a short-lived signed GET.
    purpose: Literal["property", "kyc"] = "property"


class PresignOut(BaseModel):
    key: str
    upload_url: str
    # PUT the file to upload_url with exactly this Content-Type, then send key back to the API.
    content_type: str
    expires_in: int

class DocumentUrlOut(BaseModel):
    url: str