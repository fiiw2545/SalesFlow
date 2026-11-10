from datetime import datetime
from decimal import Decimal
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field
from surrealdb import RecordID


DealStatus = Literal["OPEN", "WON", "LOST"]


class DealCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=150)
    value: Decimal = Field(ge=0)
    currency: str = Field(default="THB", min_length=3, max_length=3)
    stage_id: str

    company_id: str | None = None
    contact_id: str | None = None
    expected_close_date: datetime | None = None


class DealUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    title: str = Field(min_length=2, max_length=150)
    value: Decimal = Field(ge=0)
    currency: str = Field(min_length=3, max_length=3)
    stage_id: str
    status: DealStatus

    company_id: str | None = None
    contact_id: str | None = None
    expected_close_date: datetime | None = None


class DealResponse(BaseModel):
    id: RecordID
    title: str
    value: Decimal
    currency: str
    stage_id: RecordID
    status: DealStatus

    company_id: RecordID | None = None
    contact_id: RecordID | None = None

    owner_id: RecordID
    organization_id: RecordID

    expected_close_date: datetime | None = None
    created_at: datetime
    updated_at: datetime | None = None


class DealListResponse(BaseModel):
    items: list[DealResponse]
    total: int
    page: int
    limit: int
    total_pages: int