from decimal import Decimal
from functools import lru_cache
from typing import Literal

from pydantic import Field, PostgresDsn, RedisDsn
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", env_prefix="PROVENIX_", extra="ignore")

    environment: Literal["development", "test", "staging", "production"] = "development"

    database_url: PostgresDsn
    redis_url: RedisDsn

    jwt_secret: str = Field(min_length=32)
    jwt_algorithm: str = "HS256"
    jwt_issuer: str = "provenix"

    access_token_ttl: int = 900
    refresh_token_ttl: int = 1_209_600
    verify_token_ttl: int = 86_400
    reset_token_ttl: int = 3_600

    login_ip_limit: int = 20
    login_ip_window: int = 300
    login_max_failures: int = 5
    login_lockout_ttl: int = 900

    refresh_cookie_name: str = "provenix_refresh"
    refresh_cookie_domain: str | None = None
    refresh_cookie_secure: bool = True
    refresh_cookie_samesite: Literal["lax", "strict", "none"] = "lax"

    cors_origins: list[str] = ["http://localhost:3000"]
    app_url: str = "http://localhost:3000"

    # MinIO in development, any S3-compatible store in production. The browser uploads straight to
    # it with a presigned URL, so file bytes never pass through this API.
    s3_endpoint: str = "http://localhost:9000"
    s3_access_key: str = "minioadmin"
    # MinIO's well-known development credential, overridden by PROVENIX_S3_SECRET_KEY anywhere real.
    s3_secret_key: str = "minioadmin"  # noqa: S105
    s3_bucket: str = "provenix"
    s3_region: str = "us-east-1"
    s3_url_ttl: int = 900

    # Share of the price a Buy Now token payment reserves the property with.
    purchase_token_percent: Decimal = Decimal(10)

    @property
    def is_production(self) -> bool:
        return self.environment == "production"


@lru_cache
def get_settings() -> Settings:
    return Settings()  # type: ignore[call-arg]


settings = get_settings()
