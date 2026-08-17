import uuid
from datetime import datetime
from enum import StrEnum

from pydantic import BaseModel, ConfigDict, Field, model_validator


class CreateCategoryRequest(BaseModel):
    name: str = Field(min_length=1, max_length=120)
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


# class FieldTypeSchema(StrEnum):
#     TEXT = "text"
#     NUMBER = "number"
#     DROPDOWN = "dropdown"
#     DATE = "date"
#     BOOLEAN = "boolean"
#     FILE = "file"
class FieldTypeSchema(StrEnum):
    TEXT = "text"
    TEXTAREA = "textarea"
    NUMBER = "number"
    SELECT = "select"
    DATE = "date"
    BOOLEAN = "boolean"


class CategoryFieldOut(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    category_id: uuid.UUID
    label: str
    field_type: FieldTypeSchema
    options: list[str] | None
    required: bool
    sort_order: int
    created_at: datetime


class CreateCategoryFieldRequest(BaseModel):
    label: str = Field(min_length=1, max_length=120)
    field_type: FieldTypeSchema
    options: list[str] | None = None
    required: bool = False
    sort_order: int = Field(default=0, ge=0)

    @model_validator(mode="after")
    def options_required_for_dropdown(self) -> "CreateCategoryFieldRequest":
        # if self.field_type == FieldTypeSchema.DROPDOWN and not self.options:
        if self.field_type == FieldTypeSchema.SELECT and not self.options:
            raise ValueError("options are required for dropdown fields")
        return self


class UpdateCategoryFieldRequest(BaseModel):
    label: str | None = Field(default=None, min_length=1, max_length=120)
    field_type: FieldTypeSchema | None = None
    options: list[str] | None = None
    required: bool | None = None
    sort_order: int | None = Field(default=None, ge=0)


# class CategoryTreeOut(CategoryOut):
#     """A main category with its subcategories and custom fields."""

#     children: list[CategoryOut] = []
#     fields: list[CategoryFieldOut] = []

class CategoryTreeOut(CategoryOut):
    """A main category with its subcategories and custom fields."""

    children: list["CategoryTreeOut"] = []
    fields: list[CategoryFieldOut] = []


CategoryTreeOut.model_rebuild()