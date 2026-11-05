
from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from surrealdb import RecordID


class StageCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    position: int = Field(ge=1)
    probability: int = Field(default=0, ge=0, le=100)


class StageUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=2, max_length=100)
    position: int = Field(ge=1)
    probability: int = Field(ge=0, le=100)


class StageResponse(BaseModel):
    id: RecordID
    pipeline_id: RecordID
    name: str
    position: int
    probability: int
    created_at: datetime
    updated_at: datetime | None = None
