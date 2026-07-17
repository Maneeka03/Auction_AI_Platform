import uuid
from decimal import Decimal

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DbSession, requires
from app.models.property import PropertyCategory, PropertyStatus
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.property import (
    CreatePropertyRequest,
    PropertyOut,
    PropertyPage,
    PurchaseRequest,
    UpdatePropertyRequest,
    VoteRequest,
)
from app.services import approvals, properties

router = APIRouter(prefix="/properties", tags=["properties"])

Reader = Depends(requires(Module.ASSET_MANAGEMENT, Access.VIEW))
Manager = Depends(requires(Module.ASSET_MANAGEMENT, Access.FULL))
Buyer = Depends(requires(Module.PAYMENT_ESCROW, Access.FULL))


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


@router.post("/{property_id}/purchase", response_model=PropertyOut)
async def purchase_property(
    property_id: uuid.UUID,
    payload: PurchaseRequest,
    session: DbSession,
    actor: User = Buyer,
) -> PropertyOut:
    return PropertyOut.of(await properties.purchase(session, actor, property_id, payload.method))


@router.post("/{property_id}/votes", response_model=PropertyOut)
async def vote_on_property(
    property_id: uuid.UUID,
    payload: VoteRequest,
    session: DbSession,
    actor: CurrentUser,
) -> PropertyOut:
    """Cast this approver's seat on a draft listing. Two matching votes settle it."""
    return PropertyOut.of(await approvals.cast(session, actor, property_id, payload.approved))

@router.delete("/{property_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_property(
    property_id: uuid.UUID, session: DbSession, _: User = Manager
) -> None:
    await properties.delete(session, property_id)