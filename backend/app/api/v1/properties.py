import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
from app.models.property import PropertyCategory, PropertyStatus
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.property import (
    CreatePropertyRequest,
    PropertyOut,
    PropertyPage,
    UpdatePropertyRequest,
)
from app.services import properties

router = APIRouter(prefix="/properties", tags=["properties"])

Reader = Depends(requires(Module.ASSET_MANAGEMENT, Access.VIEW))
Manager = Depends(requires(Module.ASSET_MANAGEMENT, Access.FULL))


@router.post("", response_model=PropertyOut, status_code=status.HTTP_201_CREATED)
async def create_property(
    payload: CreatePropertyRequest, session: DbSession, actor: User = Manager
) -> PropertyOut:
    return PropertyOut.of(await properties.create(session, actor, payload))


@router.get("", response_model=PropertyPage)
async def list_properties(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(25, ge=1, le=100),
    search: str | None = Query(None, max_length=120),
    category: PropertyCategory | None = None,
    status_filter: PropertyStatus | None = Query(None, alias="status"),
    min_price: Decimal | None = Query(None, gt=0),
    max_price: Decimal | None = Query(None, gt=0),
    _: User = Reader,
) -> PropertyPage:
    items, total = await properties.paginate(
        session, page, size, search, category, status_filter, min_price, max_price
    )
    return PropertyPage(
        items=[PropertyOut.of(item) for item in items],
        total=total,
        page=page,
        size=size,
    )


@router.get("/{property_id}", response_model=PropertyOut)
async def get_property(property_id: uuid.UUID, session: DbSession, _: User = Reader) -> PropertyOut:
    return PropertyOut.of(await properties.get(session, property_id))


@router.patch("/{property_id}", response_model=PropertyOut)
async def update_property(
    property_id: uuid.UUID,
    payload: UpdatePropertyRequest,
    session: DbSession,
    _: User = Manager,
) -> PropertyOut:
    return PropertyOut.of(await properties.update(session, property_id, payload))
