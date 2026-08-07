import uuid

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.core import events
from app.models.support_ticket import SupportTicket
from app.schemas.support_ticket import CreateTicketRequest, UpdateTicketRequest
from app.models.notification import NotificationKind
from app.models.user import User, UserRole, UserStatus
from app.rbac.permissions import Role
from app.services import notifications



async def get_own(session: AsyncSession, ticket_id: uuid.UUID, user_id: uuid.UUID) -> SupportTicket:
    """Fetch a ticket scoped to its owner — a user can only ever see or touch their own."""
    ticket = await session.get(SupportTicket, ticket_id)
    if ticket is None or ticket.user_id != user_id:
        raise AppError(status.HTTP_404_NOT_FOUND, "ticket_not_found", "Ticket not found.")
    return ticket


async def list_own(session: AsyncSession, user_id: uuid.UUID) -> tuple[list[SupportTicket], int]:
    rows = await session.scalars(
        select(SupportTicket)
        .where(SupportTicket.user_id == user_id)
        .order_by(SupportTicket.created_at.desc())
    )
    items = list(rows.all())
    return items, len(items)


async def create(session: AsyncSession, user_id: uuid.UUID, data: CreateTicketRequest) -> SupportTicket:
    ticket = SupportTicket(
        user_id=user_id,
        subject_id=data.subject_id,
        custom_subject=data.custom_subject,
        message=data.message,
    )
    session.add(ticket)
    await session.commit()
    await session.refresh(ticket)
    return ticket


async def notify_staff_of_new_ticket(
    session: AsyncSession, ticket: SupportTicket, raised_by: User
) -> None:
    """Create one unread support notification for every staff role that handles tickets."""
    recipient_ids = list((await session.scalars(
        select(User.id)
        .join(UserRole, UserRole.user_id == User.id)
        .where(
            User.status == UserStatus.ACTIVE,
            UserRole.role.in_(
                (Role.SUPER_ADMIN, Role.GEMOLOGIST, Role.AUCTION_MANAGER)
            ),
        )
        .distinct()
    )).all())
    subject = ticket.subject.name if ticket.subject else (ticket.custom_subject or "Support request")
    for recipient_id in recipient_ids:
        notifications.push(
            session,
            recipient_id,
            NotificationKind.SUPPORT_TICKET,
            f"New support ticket from {raised_by.full_name}: {subject}",
        )
    await session.commit()
    for recipient_id in recipient_ids:
        await events.publish(events.notification_channel(recipient_id), {"type": "notification_created"})


async def update(
    session: AsyncSession, ticket_id: uuid.UUID, user_id: uuid.UUID, data: UpdateTicketRequest
) -> SupportTicket:
    ticket = await get_own(session, ticket_id, user_id)
    fields = data.model_dump(exclude_unset=True)
    if "subject_id" in fields and fields["subject_id"] is not None:
        fields["custom_subject"] = None
    elif "custom_subject" in fields and fields["custom_subject"]:
        fields["subject_id"] = None
    for field, value in fields.items():
        setattr(ticket, field, value)
    await session.commit()
    await session.refresh(ticket)
    return ticket


async def remove(session: AsyncSession, ticket_id: uuid.UUID, user_id: uuid.UUID) -> None:
    ticket = await get_own(session, ticket_id, user_id)
    await session.delete(ticket)
    await session.commit()
    
async def list_all(session: AsyncSession, page: int, size: int) -> tuple[list[tuple[SupportTicket, str, str]], int]:
    """Every ticket across every user, newest first — for the admin table view."""
    total = await session.scalar(select(func.count()).select_from(SupportTicket)) or 0
    rows = await session.execute(
        select(SupportTicket, User.full_name, User.email)
        .join(User, User.id == SupportTicket.user_id)
        .order_by(SupportTicket.created_at.desc())
        .offset((page - 1) * size)
        .limit(size)
    )
    return [(ticket, name, email) for ticket, name, email in rows.all()], total

async def get_one(session: AsyncSession, ticket_id: uuid.UUID) -> SupportTicket:
    """Fetch any ticket by ID — admin use only, no ownership check."""
    ticket = await session.get(SupportTicket, ticket_id)
    if ticket is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "ticket_not_found", "Ticket not found.")
    return ticket


async def update_status(session: AsyncSession, ticket_id: uuid.UUID, new_status: "TicketStatus") -> SupportTicket:
    """Admin-only status change - not scoped to ownership, unlike update()."""
    ticket = await session.get(SupportTicket, ticket_id)
    if ticket is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "ticket_not_found", "Ticket not found.")
    ticket.status = new_status
    await session.commit()
    await session.refresh(ticket)
    return ticket
