
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, Query
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.dashboard.schemas import (
    DashboardSummaryResponse,
    DealsByStatusResponse,
    DealsByStageResponse,
    DealsReportResponse,
    DashboardTasksResponse,
)

from app.modules.dashboard.service import (
    get_dashboard_summary,
    get_deals_status_report,
    get_deals_stage_report,
    get_deals_date_report,
    get_dashboard_tasks,
)


router = APIRouter(
    prefix="/dashboard",
    tags=["Dashboard"],
)


@router.get(
    "/summary",
    response_model=DashboardSummaryResponse,
)
async def dashboard_summary(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    try:
        return await get_dashboard_summary(
            db=db,
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))


@router.get(
    "/deals-by-status",
    response_model=DealsByStatusResponse,
)
async def deals_by_status(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    try:
        return await get_deals_status_report(
            db=db,
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))


@router.get(
    "/deals-by-stage",
    response_model=DealsByStageResponse,
)
async def deals_by_stage(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    try:
        return await get_deals_stage_report(
            db=db,
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))


@router.get(
    "/reports/deals",
    response_model=DealsReportResponse,
)
async def deals_report(
    start_date: datetime | None = Query(default=None),
    end_date: datetime | None = Query(default=None),
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    try:
        return await get_deals_date_report(
            db=db,
            organization_id=organization_id,
            start_date=start_date,
            end_date=end_date,
        )
    except ValueError as error:
        raise HTTPException(status_code=422, detail=str(error))


@router.get(
    "/tasks",
    response_model=DashboardTasksResponse,
)
async def dashboard_tasks(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await get_dashboard_tasks(
        db=db,
        organization_id=organization_id,
    )
