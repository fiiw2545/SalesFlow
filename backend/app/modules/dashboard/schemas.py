
from pydantic import BaseModel
from typing import Any


class DashboardSummaryResponse(BaseModel):
    total_deals: int
    total_deal_value: float
    won_deals: int
    won_deal_value: float
    open_deals: int
    pending_tasks: int
    overdue_tasks: int
    total_activities: int


class DealStatusItem(BaseModel):
    status: str
    count: int
    total_value: float


class DealsByStatusResponse(BaseModel):
    items: list[DealStatusItem]


class DealStageItem(BaseModel):
    stage_id: str
    stage_name: str
    count: int
    total_value: float


class DealsByStageResponse(BaseModel):
    items: list[DealStageItem]


class DealReportItem(BaseModel):
    id: str
    title: str
    value: float
    currency: str
    status: str
    created_at: Any
    expected_close_date: Any | None = None
    stage_id: str | None = None
    company_id: str | None = None
    contact_id: str | None = None


class DealsReportResponse(BaseModel):
    total_deals: int
    total_value: float
    items: list[DealReportItem]


class TaskStatusItem(BaseModel):
    status: str
    count: int


class DashboardTasksResponse(BaseModel):
    total_tasks: int
    pending_tasks: int
    overdue_tasks: int
    items: list[TaskStatusItem]
