from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field
from surrealdb import RecordID

class ActivityCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str = Field(min_length=2, max_length=150)
    type: str = Field(min_length=2, max_length=50)
    description: str | None = None
    deal_id: str | None = None
    contact_id: str | None = None


class ActivityUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    subject: str = Field(min_length=2, max_length=150)
    type: str = Field(min_length=2, max_length=50)
    description: str | None = None
    deal_id: str | None = None
    contact_id: str | None = None


class ActivityResponse(BaseModel):
    id: RecordID
    subject: str
    type: str
    description: str | None = None
    deal_id: RecordID | None = None
    contact_id: RecordID | None = None
    organization_id: RecordID
    performed_by: RecordID
    created_at: datetime