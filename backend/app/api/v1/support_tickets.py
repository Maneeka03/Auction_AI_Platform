import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import CurrentUser, DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.support_ticket import (
    AdminTicketOut,
    AdminTicketPage,
    CreateTicketRequest,
    TicketOut,
    TicketPage,
    UpdateTicketRequest,
    UpdateTicketStatusRequest,
)
from app.services import support_tickets
from sqlalchemy import select

router = APIRouter(prefix="/support-tickets", tags=["support-tickets"])

Manager = Depends(requires(Module.SYSTEM_SETTINGS, Access.FULL))


@router.get("/all", response_model=AdminTicketPage)
async def list_all_tickets(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(15, ge=1, le=100),
    _: User = Manager,
) -> AdminTicketPage:
    """Every user's tickets in one place, for the admin table view."""
    rows, total = await support_tickets.list_all(session, page, size)
    return AdminTicketPage(
        items=[
            AdminTicketOut(**TicketOut.of(ticket).model_dump(), raiser_name=name, raiser_email=email)
            for ticket, name, email in rows
        ],
        total=total,
    )


@router.get("", response_model=TicketPage)
async def list_my_tickets(session: DbSession, actor: CurrentUser) -> TicketPage:
    items, total = await support_tickets.list_own(session, actor.id)
    return TicketPage(items=[TicketOut.of(t) for t in items], total=total)


@router.post("", response_model=TicketOut, status_code=status.HTTP_201_CREATED)
async def create_ticket(payload: CreateTicketRequest, session: DbSession, actor: CurrentUser) -> TicketOut:
    return TicketOut.of(await support_tickets.create(session, actor.id, payload))


@router.patch("/{ticket_id}", response_model=TicketOut)
async def update_ticket(
    ticket_id: uuid.UUID, payload: UpdateTicketRequest, session: DbSession, actor: CurrentUser
) -> TicketOut:
    return TicketOut.of(await support_tickets.update(session, ticket_id, actor.id, payload))


@router.delete("/{ticket_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_ticket(ticket_id: uuid.UUID, session: DbSession, actor: CurrentUser) -> None:
    await support_tickets.remove(session, ticket_id, actor.id)
    
@router.patch("/{ticket_id}/status", response_model=AdminTicketOut)
async def update_ticket_status(
    ticket_id: uuid.UUID, payload: UpdateTicketStatusRequest, session: DbSession, _: User = Manager
) -> AdminTicketOut:
    ticket = await support_tickets.update_status(session, ticket_id, payload.status)
    row = await session.execute(
        select(User.full_name, User.email).where(User.id == ticket.user_id)
    )
    name, email = row.one()
    return AdminTicketOut(**TicketOut.of(ticket).model_dump(), raiser_name=name, raiser_email=email)