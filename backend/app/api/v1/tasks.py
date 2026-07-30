import uuid

from fastapi import APIRouter, Depends, Query, status

from app.api.deps import DbSession, requires
from app.models.task import TaskStatus
from app.models.user import User
from app.rbac.permissions import Access, Module
from app.schemas.task import CreateTaskRequest, TaskOut, UpdateTaskRequest
from app.services import tasks

router = APIRouter(prefix="/tasks", tags=["tasks"])

Reader = Depends(requires(Module.LEAD_MANAGEMENT, Access.VIEW))
Manager = Depends(requires(Module.LEAD_MANAGEMENT, Access.FULL))


@router.post("", response_model=TaskOut, status_code=status.HTTP_201_CREATED)
async def create_task(
    payload: CreateTaskRequest, session: DbSession, actor: User = Manager
) -> TaskOut:
    return TaskOut.of(await tasks.create(session, actor, payload))


@router.get("", response_model=list[TaskOut])
async def list_tasks(
    session: DbSession,
    page: int = Query(1, ge=1),
    size: int = Query(50, ge=1, le=100),
    assigned_to: uuid.UUID | None = None,
    status_filter: TaskStatus | None = Query(None, alias="status"),
    _: User = Reader,
) -> list[TaskOut]:
    items, _total = await tasks.paginate(session, page, size, assigned_to, status_filter)
    return [TaskOut.of(item) for item in items]


@router.patch("/{task_id}", response_model=TaskOut)
async def update_task(
    task_id: uuid.UUID, payload: UpdateTaskRequest, session: DbSession, _: User = Manager
) -> TaskOut:
    return TaskOut.of(await tasks.update(session, task_id, payload))


@router.delete("/{task_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_task(task_id: uuid.UUID, session: DbSession, _: User = Manager) -> None:
    await tasks.delete(session, task_id)
