
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from surrealdb import RecordID


class PipelineCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    is_default: bool = False


class PipelineUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    description: str | None = None
    is_default: bool = False


class PipelineResponse(BaseModel):
    id: RecordID
    name: str
    description: str | None = None
    is_default: bool
    created_at: datetime
    updated_at: datetime | None = None
