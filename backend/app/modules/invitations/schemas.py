
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


InvitationRole = Literal["ADMIN", "MANAGER", "SALES"]


class InvitationCreate(BaseModel):
    email: EmailStr
    role: InvitationRole = "SALES"


class InvitationCreateResponse(BaseModel):
    id: str
    email: EmailStr
    role: InvitationRole
    status: str
    expires_at: datetime
    message: str


class InvitationValidateResponse(BaseModel):
    email: EmailStr
    organization_name: str
    role: InvitationRole
    status: str
    expires_at: datetime
    message: str


class InvitationAcceptRequest(BaseModel):
    token: str = Field(min_length=32, max_length=256)

    # Required only when the invited email has no existing account.
    name: str | None = Field(default=None, min_length=2, max_length=100)
    password: str | None = Field(default=None, min_length=8, max_length=128)


class InvitationAcceptResponse(BaseModel):
    user_id: str
    organization_id: str
    role: InvitationRole
    message: str


class InvitationItem(BaseModel):
    id: str
    email: EmailStr
    role: InvitationRole
    status: str
    expires_at: datetime
    created_at: datetime
    accepted_at: datetime | None = None


class InvitationListResponse(BaseModel):
    items: list[InvitationItem]
    total: int


class InvitationRevokeResponse(BaseModel):
    message: str
