import uuid

from fastapi import status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.errors import AppError
from app.models.task import Task, TaskStatus
from app.models.user import User
from app.schemas.task import CreateTaskRequest, UpdateTaskRequest


async def create(session: AsyncSession, actor: User, data: CreateTaskRequest) -> Task:
    task = Task(**data.model_dump(), created_by=actor.id)
    session.add(task)
    await session.commit()
    await session.refresh(task)
    return task


async def get(session: AsyncSession, task_id: uuid.UUID) -> Task:
    task = await session.get(Task, task_id)
    if task is None:
        raise AppError(status.HTTP_404_NOT_FOUND, "task_not_found", "Task not found.")
    return task


async def paginate(
    session: AsyncSession,
    page: int,
    size: int,
    assigned_to: uuid.UUID | None,
    task_status: TaskStatus | None,
) -> tuple[list[Task], int]:
    query = select(Task)
    if assigned_to:
        query = query.where(Task.assigned_to == assigned_to)
    if task_status:
        query = query.where(Task.status == task_status)

    total = await session.scalar(select(func.count()).select_from(query.subquery())) or 0
    rows = await session.scalars(
        query.order_by(Task.created_at.desc()).offset((page - 1) * size).limit(size)
    )
    return list(rows), total


async def update(session: AsyncSession, task_id: uuid.UUID, data: UpdateTaskRequest) -> Task:
    task = await get(session, task_id)
    for field, value in data.model_dump(exclude_unset=True).items():
        setattr(task, field, value)
    await session.commit()
    await session.refresh(task)
    return task


async def delete(session: AsyncSession, task_id: uuid.UUID) -> None:
    task = await get(session, task_id)
    await session.delete(task)
    await session.commit()
