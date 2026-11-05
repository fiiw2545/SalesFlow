from surrealdb import AsyncSurreal

from app.modules.activities.repository import (
    get_activities,
    get_activity_by_id,
    create_activity,
    update_activity,
    delete_activity,
    get_deal_by_id,
    get_contact_by_id,
)


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
):
    return await get_activities(
        db=db,
        organization_id=organization_id,
    )


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

    if not result:
        return None

    return result[0]


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