# import uuid
# from datetime import datetime
# from enum import StrEnum

# from pydantic import BaseModel, ConfigDict, Field, model_validator

# from app.schemas.category import FieldTypeSchema


# class CategoryRequestStatus(StrEnum):
#     PENDING = "pending"
#     APPROVED = "approved"
#     REJECTED = "rejected"


# class CategoryRequestField(BaseModel):
#     label: str = Field(min_length=1, max_length=120)
#     field_type: FieldTypeSchema
#     options: list[str] | None = None
#     required: bool = False
#     sort_order: int = Field(default=0, ge=0)

#     @model_validator(mode="after")
#     def validate_options(self) -> "CategoryRequestField":
#         if self.field_type == FieldTypeSchema.SELECT and not self.options:
#             raise ValueError("options are required for select fields")
#         return self


# class CreateCategoryRequestPayload(BaseModel):
#     name: str = Field(min_length=1, max_length=120)
#     parent_id: uuid.UUID | None = None

#     subcategories: list[str] = Field(default_factory=list)

#     fields: list[CategoryRequestField] = Field(default_factory=list)

#     @model_validator(mode="after")
#     def validate_subcategories(self) -> "CreateCategoryRequestPayload":
#         cleaned = []

#         for name in self.subcategories:
#             name = name.strip()

#             if name and name not in cleaned:
#                 cleaned.append(name)

#         self.subcategories = cleaned
#         return self


# class ReviewCategoryRequestPayload(BaseModel):
#     status: CategoryRequestStatus
#     admin_note: str | None = None


# class CategoryRequestOut(BaseModel):
#     model_config = ConfigDict(from_attributes=True)

#     id: uuid.UUID
#     seller_id: uuid.UUID

#     name: str
#     parent_id: uuid.UUID | None

#     subcategories: list[str]
#     fields: list[CategoryRequestField]

#     status: CategoryRequestStatus

#     admin_note: str | None
#     reviewed_by: uuid.UUID | None
#     reviewed_at: datetime | None

#     created_at: datetime
#     updated_at: datetime