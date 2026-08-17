import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.task import Task, TaskStatus


class CreateTaskRequest(BaseModel):
    title: str = Field(min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    assigned_to: uuid.UUID | None = None
    due_date: date | None = None


class UpdateTaskRequest(BaseModel):
    title: str | None = Field(default=None, min_length=1, max_length=200)
    description: str | None = Field(default=None, max_length=5000)
    status: TaskStatus | None = None
    assigned_to: uuid.UUID | None = None
    due_date: date | None = None


class TaskOut(BaseModel):
    id: uuid.UUID
    title: str
    description: str | None
    status: TaskStatus
    assigned_to: uuid.UUID | None
    assignee_name: str | None
    due_date: date | None
    created_by: uuid.UUID | None
    created_at: datetime

    @classmethod
    def of(cls, task: Task) -> "TaskOut":
        return cls(
            id=task.id,
            title=task.title,
            description=task.description,
            status=task.status,
            assigned_to=task.assigned_to,
            assignee_name=task.assignee.full_name if task.assignee else None,
            due_date=task.due_date,
            created_by=task.created_by,
            created_at=task.created_at,
        )
