import uuid

from pydantic import BaseModel, ConfigDict, Field


class SidebarItemOut(BaseModel):
    """One entry in the fixed catalogue."""

    model_config = ConfigDict(from_attributes=True)

    id: uuid.UUID
    key: str
    label: str
    default_order: int


class SidebarEntryOut(BaseModel):
    """One item as the agency admin has configured it: whether it shows and where it sits."""

    item_id: uuid.UUID
    key: str
    label: str
    visible: bool
    position: int


class SidebarEntryIn(BaseModel):
    item_id: uuid.UUID
    visible: bool = True


class SaveSidebarRequest(BaseModel):
    # Order in the list is the saved order; an item's index becomes its position.
    items: list[SidebarEntryIn] = Field(min_length=1)
