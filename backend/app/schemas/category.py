import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    # Null creates a main category; an id creates a subcategory under that main category.
    parent_id: uuid.UUID | None = None


class UpdateCategoryRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    parent_id: uuid.UUID | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    parent_id: uuid.UUID | None
    created_at: datetime


class CategoryTreeOut(CategoryOut):
    """A main category with its subcategories, so one call fills a browse filter."""

    children: list[CategoryOut] = []
