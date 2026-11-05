from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field


class CompanyCreate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str = Field(min_length=1, max_length=255)
    address: str | None = None
    industry: str | None = None
    phone: str | None = None
    website: str | None = None


class CompanyUpdate(BaseModel):
    model_config = ConfigDict(extra="forbid")

    name: str | None = Field(default=None, min_length=1, max_length=255)
    address: str | None = None
    industry: str | None = None
    phone: str | None = None
    website: str | None = None


class CompanyResponse(BaseModel):
    id: str
    name: str
    address: str | None = None
    industry: str | None = None
    phone: str | None = None
    website: str | None = None
    created_by: str
    organization_id: str
    created_at: datetime
    updated_at: datetime | None = None


class CompanyListResponse(BaseModel):
    items: list[CompanyResponse]


class CompanyDeleteResponse(BaseModel):
    message: str