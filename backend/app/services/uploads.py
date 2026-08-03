import logging
import uuid
from functools import lru_cache
from pathlib import PurePosixPath

import boto3
from botocore.config import Config

from app.core.config import settings

logger = logging.getLogger(__name__)

# Only what a listing photo or an identity document can plausibly be.
ALLOWED_TYPES: dict[str, str] = {
    "image/jpeg": ".jpg",
    "image/png": ".png",
    "image/webp": ".webp",
    "image/avif": ".avif",
    "application/pdf": ".pdf",
    "model/gltf-binary": ".glb",
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


def configure_cors() -> None:
    """Apply a permissive CORS policy to the bucket so browsers can PUT presigned URLs directly."""
    try:
        _client().put_bucket_cors(
            Bucket=settings.s3_bucket,
            CORSConfiguration={
                "CORSRules": [
                    {
                        "AllowedHeaders": ["*"],
                        "AllowedMethods": ["GET", "PUT", "POST", "DELETE", "HEAD"],
                        "AllowedOrigins": ["*"],
                        "ExposeHeaders": ["ETag"],
                        "MaxAgeSeconds": 3600,
                    }
                ]
            },
        )
        logger.info("MinIO CORS configured for bucket '%s'", settings.s3_bucket)
    except Exception as exc:
        logger.warning("Could not configure MinIO CORS (non-fatal): %s", exc)


def new_key(prefix: str, content_type: str) -> str:
    """A caller never names the object: a random key stops one upload overwriting another."""
    return f"{prefix}/{uuid.uuid4()}{ALLOWED_TYPES[content_type]}"


def _public_presign_put(key: str, content_type: str) -> str:
    """Generate a presigned PUT URL using the public endpoint so browsers can reach it."""
    url: str = _client().generate_presigned_url(
        "put_object",
        Params={"Bucket": settings.s3_bucket, "Key": key, "ContentType": content_type},
        ExpiresIn=settings.s3_url_ttl,
    )
    # Replace the internal S3 endpoint with the public-facing one so the browser
    # can reach MinIO directly (internal hostnames like 'minio:9000' are unreachable
    # from the browser; s3_public_endpoint defaults to s3_endpoint on localhost).
    internal = str(settings.s3_endpoint).rstrip("/")
    public = (settings.s3_public_endpoint or settings.s3_endpoint).rstrip("/")
    if internal != public:
        url = url.replace(internal, public, 1)
    return url


def presign_put(key: str, content_type: str) -> str:
    return _public_presign_put(key, content_type)


def presign_get(key: str) -> str:
    return _client().generate_presigned_url(
        "get_object",
        Params={"Bucket": settings.s3_bucket, "Key": PurePosixPath(key).as_posix()},
        ExpiresIn=settings.s3_url_ttl,
    )
