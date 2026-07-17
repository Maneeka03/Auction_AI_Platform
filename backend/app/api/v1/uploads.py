from fastapi import APIRouter

from app.api.deps import CurrentUser
from app.core.config import settings
from app.schemas.upload import PresignOut, PresignRequest
from app.services import uploads

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign", response_model=PresignOut)
async def presign_upload(payload: PresignRequest, _: CurrentUser) -> PresignOut:
    """Hand back a short-lived URL the browser PUTs the file straight to.

    Bytes never pass through this API, so a large photo costs the server nothing. Any signed-in user
    may request one: the key is random and unguessable, and nothing is attached to a record until
    the key comes back on a create or update.
    """
    key = uploads.new_key(payload.purpose, payload.content_type)
    return PresignOut(
        key=key,
        upload_url=uploads.presign_put(key, payload.content_type),
        content_type=payload.content_type,
        expires_in=settings.s3_url_ttl,
    )
