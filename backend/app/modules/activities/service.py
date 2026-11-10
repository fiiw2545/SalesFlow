from surrealdb import AsyncSurreal
from app.modules.notifications.service import send_notification
from app.modules.activities.repository import (
    get_activities,
    count_activities,
    get_activity_by_id,
    create_activity,
    update_activity,
    delete_activity,
    get_deal_by_id,
    get_contact_by_id,
)

def extract_rows(result):
    if not isinstance(result, list):
        return []

    rows = []

    for item in result:
        if not isinstance(item, dict):
            continue

        if "id" in item:
            rows.append(item)
            continue

        nested = item.get("result")

        if isinstance(nested, list):
            rows.extend(
                row for row in nested
                if isinstance(row, dict)
            )
        elif isinstance(nested, dict):
            rows.append(nested)

    return rows


def normalize_record_id(record_id) -> str | None:
    if record_id is None:
        return None

    record_id = str(record_id)

    if ":" in record_id:
        return record_id.split(":", 1)[1]

    return record_id

async def validate_related_records(
    db: AsyncSurreal,
    organization_id: str,
    deal_id: str | None,
    contact_id: str | None,
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


async def list_activities(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
):
    items = await get_activities(
        db=db,
        organization_id=organization_id,
        page=page,
        limit=limit,
    )

    total = await count_activities(
        db=db,
        organization_id=organization_id,
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


async def retrieve_activity(
    db: AsyncSurreal,
    activity_id: str,
    organization_id: str,
):
    result = await get_activity_by_id(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
    )

    if not result:
        return None

    return result[0]


async def add_activity(
    db: AsyncSurreal,
    organization_id: str,
    performed_by: str,
    subject: str,
    type: str,
    description: str | None,
    deal_id: str | None,
    contact_id: str | None,
):
    valid = await validate_related_records(
        db=db,
        organization_id=organization_id,
        deal_id=deal_id,
        contact_id=contact_id,
    )

    if not valid:
        return None

    data = {
        "subject": subject,
        "type": type,
        "description": description,
        "deal_id": deal_id,
        "contact_id": contact_id,
        "organization_id": organization_id,
        "performed_by": performed_by,
    }

    result = await create_activity(
        db=db,
        data=data,
    )

    rows = extract_rows(result)

    if not rows:
        return None

    created_activity = rows[0]

    # Notify Deal Owner when Activity is linked to a Deal
    if deal_id:
        deal_result = await get_deal_by_id(
            db=db,
            deal_id=deal_id,
            organization_id=organization_id,
        )

        deal_rows = extract_rows(deal_result)

        if deal_rows:
            deal = deal_rows[0]
            owner_id = deal.get("owner_id")

            if (
                owner_id
                and normalize_record_id(owner_id)
                != normalize_record_id(performed_by)
            ):
                activity_id = created_activity.get("id")

                if activity_id:
                    await send_notification(
                        db=db,
                        user_id=str(owner_id),
                        organization_id=organization_id,
                        notification_type="ACTIVITY_CREATED",
                        title="มีกิจกรรมใหม่",
                        message=(
                            f'กิจกรรม "{subject}" '
                            f'ถูกเพิ่มลงในดีล "{deal.get("title", "")}" แล้ว'
                        ),
                        entity_type="activity",
                        entity_id=str(activity_id),
                    )

    return created_activity


async def edit_activity(
    db: AsyncSurreal,
    activity_id: str,
    organization_id: str,
    subject: str,
    type: str,
    description: str | None,
    deal_id: str | None,
    contact_id: str | None,
):
    existing = await get_activity_by_id(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
    )

    if not existing:
        return None

    valid = await validate_related_records(
        db=db,
        organization_id=organization_id,
        deal_id=deal_id,
        contact_id=contact_id,
    )

    if not valid:
        return None

    data = {
        "subject": subject,
        "type": type,
        "description": description,
        "deal_id": deal_id,
        "contact_id": contact_id,
    }

    result = await update_activity(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
        data=data,
    )

    if not result:
        return None

    return result[0]


async def remove_activity(
    db: AsyncSurreal,
    activity_id: str,
    organization_id: str,
):
    existing = await get_activity_by_id(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
    )

    if not existing:
        return None

    return await delete_activity(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
    )