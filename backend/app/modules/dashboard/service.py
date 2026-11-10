
from surrealdb import AsyncSurreal

from app.modules.dashboard.repository import (
    get_deal_summary,
    get_deals_by_status,
    get_deals_by_stage,
    get_deals_report,
    get_task_summary,
    get_overdue_task_count,
    get_activity_count,
)


def validate_date_range(start_date=None, end_date=None):
    if start_date and end_date and start_date > end_date:
        raise ValueError(
            "start_date must be before or equal to end_date"
        )


def get_count(result):
    if not result:
        return 0

    return int(result[0].get("count", 0) or 0)


def get_number(value):
    if value is None:
        return 0.0

    return float(value)


async def get_dashboard_summary(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    validate_date_range(start_date, end_date)

    deal_result = await get_deal_summary(
        db, organization_id, start_date, end_date
    )

    status_result = await get_deals_by_status(
        db, organization_id, start_date, end_date
    )

    # Tasks และ Activities ยังคงเป็นยอดทั้งหมด
    task_result = await get_task_summary(db, organization_id)
    overdue_result = await get_overdue_task_count(db, organization_id)
    activity_result = await get_activity_count(db, organization_id)

    deal_data = deal_result[0] if deal_result else {}

    total_deals = int(deal_data.get("total_deals", 0) or 0)
    total_deal_value = get_number(deal_data.get("total_value"))

    won_deals = 0
    won_deal_value = 0.0
    open_deals = 0

    for item in status_result:
        status = item.get("status")
        count = int(item.get("count", 0) or 0)

        if status == "WON":
            won_deals = count
            won_deal_value = get_number(item.get("total_value"))

        if status == "OPEN":
            open_deals = count

    pending_tasks = sum(
        int(item.get("count", 0) or 0)
        for item in task_result
        if item.get("status") in ["PENDING", "IN_PROGRESS"]
    )

    return {
        "total_deals": total_deals,
        "total_deal_value": total_deal_value,
        "won_deals": won_deals,
        "won_deal_value": won_deal_value,
        "open_deals": open_deals,
        "pending_tasks": pending_tasks,
        "overdue_tasks": get_count(overdue_result),
        "total_activities": get_count(activity_result),
    }


async def get_deals_status_report(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    validate_date_range(start_date, end_date)

    result = await get_deals_by_status(
        db,
        organization_id,
        start_date,
        end_date,
    )

    return {
        "items": [
            {
                "status": item["status"],
                "count": int(item.get("count", 0) or 0),
                "total_value": get_number(item.get("total_value")),
            }
            for item in result
        ]
    }


async def get_deals_stage_report(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    validate_date_range(start_date, end_date)

    result = await get_deals_by_stage(
        db,
        organization_id,
        start_date,
        end_date,
    )

    items = []

    for item in result:
        stage_name = item.get("stage_name")

        if isinstance(stage_name, list):
            stage_name = next(
                (
                    name
                    for name in stage_name
                    if isinstance(name, str) and name
                ),
                "Unknown",
            )

        if not isinstance(stage_name, str) or not stage_name:
            stage_name = "Unknown"

        items.append({
            "stage_id": str(item.get("stage_id", "")),
            "stage_name": stage_name,
            "count": int(item.get("count", 0) or 0),
            "total_value": get_number(item.get("total_value")),
        })

    return {"items": items}


async def get_deals_date_report(
    db: AsyncSurreal,
    organization_id,
    start_date=None,
    end_date=None,
):
    validate_date_range(start_date, end_date)

    result = await get_deals_report(
        db=db,
        organization_id=organization_id,
        start_date=start_date,
        end_date=end_date,
    )

    total_value = sum(
        get_number(item.get("value"))
        for item in result
    )

    return {
        "total_deals": len(result),
        "total_value": total_value,
        "items": [
            {
                "id": str(item["id"]),
                "title": item["title"],
                "value": get_number(item.get("value")),
                "currency": item.get("currency", "THB"),
                "status": item["status"],
                "created_at": item["created_at"],
                "expected_close_date": item.get("expected_close_date"),
                "stage_id": (
                    str(item["stage_id"])
                    if item.get("stage_id") else None
                ),
                "company_id": (
                    str(item["company_id"])
                    if item.get("company_id") else None
                ),
                "contact_id": (
                    str(item["contact_id"])
                    if item.get("contact_id") else None
                ),
            }
            for item in result
        ],
    }


async def get_dashboard_tasks(
    db: AsyncSurreal,
    organization_id,
):
    result = await get_task_summary(db, organization_id)
    overdue_result = await get_overdue_task_count(db, organization_id)

    total_tasks = sum(
        int(item.get("count", 0) or 0)
        for item in result
    )

    pending_tasks = sum(
        int(item.get("count", 0) or 0)
        for item in result
        if item.get("status") in ["PENDING", "IN_PROGRESS"]
    )

    return {
        "total_tasks": total_tasks,
        "pending_tasks": pending_tasks,
        "overdue_tasks": get_count(overdue_result),
        "items": [
            {
                "status": item["status"],
                "count": int(item.get("count", 0) or 0),
            }
            for item in result
        ],
    }
