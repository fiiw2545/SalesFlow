from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from surrealdb import RecordID


class TagCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    color: str | None = None


class TagUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    color: str | None = None


class TagResponse(BaseModel):
    id: RecordID
    name: str
    color: str | None = None
    organization_id: RecordID
    created_at: datetime


class TagAssignmentCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    tag_id: str


class TagAssignmentResponse(BaseModel):
    id: RecordID
    organization_id: RecordID
    tag_id: RecordID
    created_at: datetime