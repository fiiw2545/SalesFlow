from datetime import datetime, timezone

from surrealdb import AsyncSurreal

from app.modules.notes.repository import (
    get_notes,
    count_notes,
    get_note_by_id,
    create_note,
    update_note,
    delete_note,
    get_company_by_id,
    get_contact_by_id,
    get_deal_by_id,
)


async def validate_related_records(
    db: AsyncSurreal,
    company_id: str | None,
    contact_id: str | None,
    deal_id: str | None,
    organization_id: str,
):
    if company_id:
        company = await get_company_by_id(
            db=db,
            company_id=company_id,
            organization_id=organization_id,
        )

        if not company:
            return False

    if contact_id:
        contact = await get_contact_by_id(
            db=db,
            contact_id=contact_id,
            organization_id=organization_id,
        )

        if not contact:
            return False

    if deal_id:
        deal = await get_deal_by_id(
            db=db,
            deal_id=deal_id,
            organization_id=organization_id,
        )

        if not deal:
            return False

    return True


async def list_notes(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
):
    items = await get_notes(
        db=db,
        organization_id=organization_id,
        page=page,
        limit=limit,
    )

    total = await count_notes(
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


async def retrieve_note(
    db: AsyncSurreal,
    note_id: str,
    organization_id: str,
):
    result = await get_note_by_id(
        db=db,
        note_id=note_id,
        organization_id=organization_id,
    )

    if not result:
        return None

    return result[0]


async def add_note(
    db: AsyncSurreal,
    data: dict,
    organization_id: str,
    created_by: str,
):
    is_valid = await validate_related_records(
        db=db,
        company_id=data.get("company_id"),
        contact_id=data.get("contact_id"),
        deal_id=data.get("deal_id"),
        organization_id=organization_id,
    )

    if not is_valid:
        return None

    note_data = {
        "title": data["title"],
        "content": data["content"],
        "company_id": data.get("company_id"),
        "contact_id": data.get("contact_id"),
        "deal_id": data.get("deal_id"),
        "organization_id": organization_id,
        "created_by": created_by,
    }

    result = await create_note(
        db=db,
        data=note_data,
    )

    if not result:
        return None

    return result[0]


async def edit_note(
    db: AsyncSurreal,
    note_id: str,
    data: dict,
    organization_id: str,
):
    existing_note = await retrieve_note(
        db=db,
        note_id=note_id,
        organization_id=organization_id,
    )

    if not existing_note:
        return None

    is_valid = await validate_related_records(
        db=db,
        company_id=data.get("company_id"),
        contact_id=data.get("contact_id"),
        deal_id=data.get("deal_id"),
        organization_id=organization_id,
    )

    if not is_valid:
        return None

    note_data = {
        "title": data["title"],
        "content": data["content"],
        "company_id": data.get("company_id"),
        "contact_id": data.get("contact_id"),
        "deal_id": data.get("deal_id"),
        "updated_at": datetime.now(timezone.utc),
    }

    result = await update_note(
        db=db,
        note_id=note_id,
        organization_id=organization_id,
        data=note_data,
    )

    if not result:
        return None

    return result[0]


async def remove_note(
    db: AsyncSurreal,
    note_id: str,
    organization_id: str,
):
    existing_note = await retrieve_note(
        db=db,
        note_id=note_id,
        organization_id=organization_id,
    )

    if not existing_note:
        return None

    result = await delete_note(
        db=db,
        note_id=note_id,
        organization_id=organization_id,
    )

    if not result:
        return None

    return result[0]