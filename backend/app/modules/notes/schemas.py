from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field
from surrealdb import RecordID


class NoteCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=150)
    content: str = Field(min_length=1)

    company_id: str | None = None
    contact_id: str | None = None
    deal_id: str | None = None


class NoteUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=150)
    content: str = Field(min_length=1)

    company_id: str | None = None
    contact_id: str | None = None
    deal_id: str | None = None


class NoteResponse(BaseModel):
    id: RecordID
    title: str
    content: str

    company_id: RecordID | None = None
    contact_id: RecordID | None = None
    deal_id: RecordID | None = None

    organization_id: RecordID
    created_by: RecordID

    created_at: datetime
    updated_at: datetime | None = None