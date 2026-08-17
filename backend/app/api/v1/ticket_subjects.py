import uuid

from fastapi import APIRouter, Depends, status

from app.api.deps import CurrentUser, DbSession, requires
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.ticket_subject import (
    CreateTicketSubjectRequest,
    TicketSubjectOut,
    TicketSubjectPage,
    UpdateTicketSubjectRequest,
)
from app.services import ticket_subjects

router = APIRouter(prefix="/ticket-subjects", tags=["ticket-subjects"])

Manager = Depends(requires(Module.SYSTEM_SETTINGS, Access.FULL))


@router.get("", response_model=TicketSubjectPage)
async def list_subjects(session: DbSession, actor: CurrentUser) -> TicketSubjectPage:
    """Any signed-in user sees the active list to populate the ticket form's dropdown."""
    items, total = await ticket_subjects.list_all(session, active_only=True)
    return TicketSubjectPage(items=[TicketSubjectOut.of(s) for s in items], total=total)


@router.get("/all", response_model=TicketSubjectPage)
async def list_all_subjects(session: DbSession, _: User = Manager) -> TicketSubjectPage:
    """Every subject including inactive ones — for the Super Admin management page."""
    items, total = await ticket_subjects.list_all(session, active_only=False)
    return TicketSubjectPage(items=[TicketSubjectOut.of(s) for s in items], total=total)


@router.post("", response_model=TicketSubjectOut, status_code=status.HTTP_201_CREATED)
async def create_subject(
    payload: CreateTicketSubjectRequest, session: DbSession, _: User = Manager
) -> TicketSubjectOut:
    return TicketSubjectOut.of(await ticket_subjects.create(session, payload))


@router.patch("/{subject_id}", response_model=TicketSubjectOut)
async def update_subject(
    subject_id: uuid.UUID, payload: UpdateTicketSubjectRequest, session: DbSession, _: User = Manager
) -> TicketSubjectOut:
    return TicketSubjectOut.of(await ticket_subjects.update(session, subject_id, payload))


@router.delete("/{subject_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_subject(subject_id: uuid.UUID, session: DbSession, _: User = Manager) -> None:
    await ticket_subjects.remove(session, subject_id)