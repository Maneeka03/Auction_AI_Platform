from fastapi import APIRouter, HTTPException, UploadFile, status
from pydantic import BaseModel

from app.api.deps import CurrentUser
from app.core.config import settings
from app.schemas.upload import PresignOut, PresignRequest
from app.services import uploads

router = APIRouter(prefix="/uploads", tags=["uploads"])


@router.post("/presign", response_model=PresignOut)
async def presign_upload(payload: PresignRequest, _: CurrentUser) -> PresignOut:
    key = uploads.new_key(payload.purpose, payload.content_type)
    return PresignOut(
        key=key,
        upload_url=uploads.presign_put(key, payload.content_type),
        content_type=payload.content_type,
        expires_in=settings.s3_url_ttl,
    )


class FileUploadOut(BaseModel):
    url: str
    key: str


@router.post("/file", response_model=FileUploadOut, status_code=status.HTTP_201_CREATED)
async def upload_file(
    file: UploadFile,
    _: CurrentUser,
    purpose: str = "property",
) -> FileUploadOut:
    """Accept a multipart file and store it in MinIO server-side.

    Avoids CORS entirely — the browser POSTs to this API (same origin),
    and this API talks to MinIO directly.
    """
    content_type = file.content_type or ""
    if content_type not in uploads.ALLOWED_TYPES:
        raise HTTPException(
            status_code=status.HTTP_415_UNSUPPORTED_MEDIA_TYPE,
            detail=f"Unsupported file type: {content_type}",
        )
    key = uploads.new_key(purpose, content_type)
    contents = await file.read()
    uploads._client().put_object(
        Bucket=settings.s3_bucket,
        Key=key,
        Body=contents,
        ContentType=content_type,
    )
    return FileUploadOut(url=f"/minio/{settings.s3_bucket}/{key}", key=key)
