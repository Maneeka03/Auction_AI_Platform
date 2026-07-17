import uuid
from functools import lru_cache
from pathlib import PurePosixPath

import boto3
from botocore.config import Config

from app.core.config import settings

# Only what a listing photo or an identity document can plausibly be.
ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "application/pdf": ".pdf",
}


@lru_cache
def _client():
    return boto3.client(
        "s3",
        endpoint_url=str(settings.s3_endpoint),
        aws_access_key_id=settings.s3_access_key,
        aws_secret_access_key=settings.s3_secret_key,
        config=Config(signature_version="s3v4"),
        region_name=settings.s3_region,
    )


def new_key(prefix: str, content_type: str) -> str:
    """A caller never names the object: a random key stops one upload overwriting another."""
    return f"{prefix}/{uuid.uuid4()}{ALLOWED_TYPES[content_type]}"


def presign_put(key: str, content_type: str) -> str:
    return _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=settings.s3_url_ttl,
    )


def presign_get(key: str) -> str:
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": PurePosixPath(key).as_posix()},
        ExpiresIn=settings.s3_url_ttl,
    )
