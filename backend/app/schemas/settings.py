from pydantic import BaseModel, Field, field_validator


class BrandingOut(BaseModel):
    platform_name: str
    logo_url: str | None
    primary_color: str


class UpdateBrandingRequest(BaseModel):
    platform_name: str | None = Field(default=None, min_length=2, max_length=80)
    logo_url: str | None = Field(default=None, max_length=2048)
    primary_color: str | None = Field(default=None, pattern=r"^#[0-9a-fA-F]{6}$")

    @field_validator("logo_url")
    @classmethod
    def validate_logo_url(cls, v: str | None) -> str | None:
        if v is not None and not v.startswith(("http://", "https://")):
            raise ValueError("logo_url must be a valid HTTP/HTTPS URL")
        return v
