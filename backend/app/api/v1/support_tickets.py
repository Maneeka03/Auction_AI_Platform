import asyncio
import uuid

from fastapi import APIRouter, Depends, Query, WebSocket, WebSocketDisconnect, status
from sqlalchemy import select

from app.api.deps import CurrentUser, DbSession, requires, socket_user
from app.core import email as email_service
from app.core import events
from app.db.session import SessionFactory
from app.models.user import User
from app.rbac.permissions import Access, Module, can
from app.schemas.support_ticket import (
    AdminTicketOut,
    AdminTicketPage,
    CreateTicketRequest,
    ReplyRequest,
    TicketOut,
    TicketPage,
    UpdateTicketRequest,
    UpdateTicketStatusRequest,
)
from app.services import support_tickets

router = APIRouter(prefix="/support-tickets", tags=["support-tickets"])

Manager = Depends(requires(Module.SYSTEM_SETTINGS, Access.FULL))


@router.get("/all", response_model=AdminTicketPage)
async def list_all_tickets(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(15, ge=1, le=100),
    _: User = Manager,
) -> AdminTicketPage:
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
    ticket = await support_tickets.create(session, actor.id, payload)
    out = TicketOut.of(ticket)
    admin_out = AdminTicketOut(**out.model_dump(), raiser_name=actor.full_name, raiser_email=actor.email)
    await events.publish(events.ticket_channel(), {
        "type": "ticket_created",
        "ticket": admin_out.model_dump(mode="json"),
    })
    return out


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
    admin_out = AdminTicketOut(**TicketOut.of(ticket).model_dump(), raiser_name=name, raiser_email=email)
    await events.publish(events.ticket_channel(), {
        "type": "ticket_updated",
        "ticket": admin_out.model_dump(mode="json"),
    })
    return admin_out


@router.post("/{ticket_id}/reply", status_code=status.HTTP_204_NO_CONTENT)
async def reply_to_ticket(
    ticket_id: uuid.UUID,
    payload: ReplyRequest,
    session: DbSession,
    actor: User = Manager,
) -> None:
    ticket = await support_tickets.get_one(session, ticket_id)
    row = await session.execute(
        select(User.full_name, User.email).where(User.id == ticket.user_id)
    )
    raiser_name, raiser_email = row.one()

    subject_label = ticket.subject.name if ticket.subject else (ticket.custom_subject or "Support Request")
    body = (
        f"Hi {raiser_name},\n\n"
        f"You have received a reply to your support ticket:\n\n"
        f"Subject: {subject_label}\n"
        f"Your message: {ticket.message}\n\n"
        f"Reply from {actor.full_name}:\n{payload.message}\n\n"
        f"— Support Team"
    )
    await email_service.send_email(
        to_email=raiser_email,
        to_name=raiser_name,
        subject=f"Re: {subject_label}",
        body=body,
    )


async def _relay(websocket: WebSocket, channel: str) -> None:
    async for event in events.subscribe(channel):
        await websocket.send_json(event)


@router.websocket("/ws")
async def tickets_ws(websocket: WebSocket, token: str) -> None:
    await websocket.accept()

    async with SessionFactory() as session:
        user = await socket_user(session, token)
        if user is None or not can(user.roles, Module.SYSTEM_SETTINGS, Access.FULL):
            await websocket.close(code=4401)
            return

    relay = asyncio.create_task(_relay(websocket, events.ticket_channel()))
    try:
        while True:
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        relay.cancel()
