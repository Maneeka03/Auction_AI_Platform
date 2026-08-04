import uuid
from datetime import datetime

from pydantic import BaseModel, Field

from app.models.faq import FAQ


class CreateFAQRequest(BaseModel):
    question: str = Field(min_length=3, max_length=300)
    answer: str = Field(min_length=1)
    category: str | None = Field(default=None, max_length=100)
    sort_order: int = 0
    is_published: bool = True


class UpdateFAQRequest(BaseModel):
    question: str | None = Field(default=None, min_length=3, max_length=300)
    answer: str | None = Field(default=None, min_length=1)
    category: str | None = Field(default=None, max_length=100)
    sort_order: int | None = None
    is_published: bool | None = None


class FAQOut(BaseModel):
    id: uuid.UUID
    question: str
    answer: str
    category: str | None
    sort_order: int
    is_published: bool
    created_at: datetime
    updated_at: datetime

    @classmethod
    def of(cls, faq: FAQ) -> "FAQOut":
        return cls(
            id=faq.id,
            question=faq.question,
            answer=faq.answer,
            category=faq.category,
            sort_order=faq.sort_order,
            is_published=faq.is_published,
            created_at=faq.created_at,
            updated_at=faq.updated_at,
        )


class FAQPage(BaseModel):
    items: list[FAQOut]
    total: int
    page: int
    size: int