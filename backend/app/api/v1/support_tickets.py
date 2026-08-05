import uuid

from fastapi import APIRouter, status

from app.api.deps import CurrentUser, DbSession
from app.schemas.support_ticket import CreateTicketRequest, TicketOut, TicketPage, UpdateTicketRequest
from app.services import support_tickets

router = APIRouter(prefix="/support-tickets", tags=["support-tickets"])


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