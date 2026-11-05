from datetime import datetime, timezone

from surrealdb import AsyncSurreal

from app.modules.tasks.repository import (
    get_tasks,
    get_task_by_id,
    create_task,
    update_task,
    delete_task,
    get_deal_by_id,
    get_contact_by_id,
)


async def validate_related_records(
    db: AsyncSurreal,
    deal_id: str | None,
    contact_id: str | None,
    organization_id: str,
):
    if deal_id:
        deal = await get_deal_by_id(
            db=db,
            deal_id=deal_id,
            organization_id=organization_id,
        )

        if not deal:
            return False

    if contact_id:
        contact = await get_contact_by_id(
            db=db,
            contact_id=contact_id,
            organization_id=organization_id,
        )

        if not contact:
            return False

    return True


async def list_tasks(
    db: AsyncSurreal,
    organization_id: str,
):
    return await get_tasks(
        db=db,
        organization_id=organization_id,
    )


async def retrieve_task(
    db: AsyncSurreal,
    task_id: str,
    organization_id: str,
):
    result = await get_task_by_id(
        db=db,
        task_id=task_id,
        organization_id=organization_id,
    )

    if not result:
        return None

    return result[0]


async def add_task(
    db: AsyncSurreal,
    data: dict,
    organization_id: str,
    assigned_to: str,
):
    is_valid = await validate_related_records(
        db=db,
        deal_id=data.get("deal_id"),
        contact_id=data.get("contact_id"),
        organization_id=organization_id,
    )

    if not is_valid:
        return None

    if data["status"] == "COMPLETED":
        completed_at = datetime.now(timezone.utc)
    else:
        completed_at = None

    task_data = {
        "title": data["title"],
        "description": data.get("description"),
        "due_date": data.get("due_date"),
        "priority": data["priority"],
        "status": data["status"],
        "completed_at": completed_at,
        "deal_id": data.get("deal_id"),
        "contact_id": data.get("contact_id"),
        "assigned_to": assigned_to,
        "organization_id": organization_id,
    }

    result = await create_task(
        db=db,
        data=task_data,
    )

    if not result:
        return None

    return result[0]


async def edit_task(
    db: AsyncSurreal,
    task_id: str,
    data: dict,
    organization_id: str,
):
    existing_task = await retrieve_task(
        db=db,
        task_id=task_id,
        organization_id=organization_id,
    )

    if not existing_task:
        return None

    is_valid = await validate_related_records(
        db=db,
        deal_id=data.get("deal_id"),
        contact_id=data.get("contact_id"),
        organization_id=organization_id,
    )

    if not is_valid:
        return None

    if data["status"] == "COMPLETED":
        completed_at = (
            existing_task.get("completed_at")
            or datetime.now(timezone.utc)
        )
    else:
        completed_at = None

    task_data = {
        "title": data["title"],
        "description": data.get("description"),
        "due_date": data.get("due_date"),
        "priority": data["priority"],
        "status": data["status"],
        "completed_at": completed_at,
        "deal_id": data.get("deal_id"),
        "contact_id": data.get("contact_id"),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await update_task(
        db=db,
        task_id=task_id,
        organization_id=organization_id,
        data=task_data,
    )

    if not result:
        return None

    return result[0]


async def remove_task(
    db: AsyncSurreal,
    task_id: str,
    organization_id: str,
):
    existing_task = await retrieve_task(
        db=db,
        task_id=task_id,
        organization_id=organization_id,
    )

    if not existing_task:
        return None

    result = await delete_task(
        db=db,
        task_id=task_id,
        organization_id=organization_id,
    )

    if not result:
        return None

    return result[0]