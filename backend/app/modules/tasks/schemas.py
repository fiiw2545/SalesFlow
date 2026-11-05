from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from surrealdb import RecordID


TaskStatus = Literal[
    "PENDING",
    "IN_PROGRESS",
    "COMPLETED",
    "CANCELLED",
]

TaskPriority = Literal[
    "LOW",
    "MEDIUM",
    "HIGH",
    "URGENT",
]


class TaskCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=150)
    description: str | None = None
    due_date: datetime | None = None
    priority: TaskPriority = "MEDIUM"
    status: TaskStatus = "PENDING"
    deal_id: str | None = None
    contact_id: str | None = None


class TaskUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=150)
    description: str | None = None
    due_date: datetime | None = None
    priority: TaskPriority
    status: TaskStatus
    deal_id: str | None = None
    contact_id: str | None = None


class TaskResponse(BaseModel):
    id: RecordID
    title: str
    description: str | None = None
    due_date: datetime | None = None
    priority: str
    status: str
    completed_at: datetime | None = None
    deal_id: RecordID | None = None
    contact_id: RecordID | None = None
    assigned_to: RecordID
    organization_id: RecordID
    created_at: datetime
    updated_at: datetime | None = None