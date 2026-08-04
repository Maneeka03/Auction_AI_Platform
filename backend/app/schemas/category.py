import uuid
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field

from app.models.category import CategoryFieldType


class CategoryFieldIn(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    field_type: CategoryFieldType
    options: list[str] | None = None
    unit: str | None = Field(default=None, max_length=40)
    required: bool = False


class CategoryFieldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    label: str
    field_key: str
    field_type: CategoryFieldType
    options: list[str] | None
    unit: str | None
    required: bool
    sort_order: int


class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
    # Null creates a main category; an id creates a subcategory under that main category.
    parent_id: uuid.UUID | None = None
    group_label: str | None = Field(default=None, max_length=120)
    fields: list[CategoryFieldIn] = []


class UpdateCategoryRequest(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=120)
    parent_id: uuid.UUID | None = None
    group_label: str | None = Field(default=None, max_length=120)
    # Omit to leave fields unchanged; pass a list to replace the whole set.
    fields: list[CategoryFieldIn] | None = None


class CategoryOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    name: str
    slug: str
    parent_id: uuid.UUID | None
    group_label: str | None
    fields: list[CategoryFieldOut] = []
    created_at: datetime


class CategoryTreeOut(CategoryOut):
    """A main category with its subcategories, so one call fills a browse filter."""

    children: list[CategoryOut] = []
