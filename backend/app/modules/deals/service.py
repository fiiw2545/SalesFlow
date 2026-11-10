
from datetime import datetime, timezone

from surrealdb import AsyncSurreal
from app.modules.notifications.service import send_notification
from app.modules.pipelines.repository import get_pipeline_by_id

from app.modules.deals.repository import (
    get_deals,
    count_deals,
    get_deal_by_id,
    create_deal,
    update_deal,
    delete_deal,
    get_stage_by_id,
    get_company_by_id,
    get_contact_by_id,
)


def normalize_record_id(record_id) -> str | None:
    if record_id is None:
        return None

    record_id = str(record_id)

    if ":" in record_id:
        return record_id.split(":", 1)[1]

    return record_id

async def validate_stage(
    db: AsyncSurreal,
    stage_id: str,
    organization_id: str,
):
    stage_result = await get_stage_by_id(
        db=db,
        stage_id=stage_id,
    )

    if not stage_result:
        return False

    stage = stage_result[0]

    pipeline_id = str(stage["pipeline_id"])


    pipeline_result = await get_pipeline_by_id(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not pipeline_result:
        return False

    return True



async def validate_related_records(
    db: AsyncSurreal,
    organization_id: str,
    stage_id: str,
    company_id: str | None,
    contact_id: str | None,
):
    # 1. ตรวจสอบ Stage และ Pipeline
    valid_stage = await validate_stage(
        db=db,
        stage_id=stage_id,
        organization_id=organization_id,
    )

    if not valid_stage:
        return False

    # 2. ตรวจสอบ Company ใน Organization
    company = None

    if company_id:
        company = await get_company_by_id(
            db=db,
            company_id=company_id,
            organization_id=organization_id,
        )

        if not company:
            return False

    # 3. ตรวจสอบ Contact ใน Organization
    contact = None

    if contact_id:
        contact = await get_contact_by_id(
            db=db,
            contact_id=contact_id,
            organization_id=organization_id,
        )

        if not contact:
            return False

    # 4. ตรวจสอบว่า Contact สังกัด Company ที่ระบุจริง
    if company_id and contact_id:
        contact_company_id = contact[0].get("company_id")

        if not contact_company_id:
            return False

        if (
            normalize_record_id(contact_company_id)
            != normalize_record_id(company_id)
        ):
            return False

    return True


async def list_deals(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
):
    search = search.strip().lower() if search else None

    items = await get_deals(
        db=db,
        organization_id=organization_id,
        page=page,
        limit=limit,
        search=search,
    )

    total = await count_deals(
        db=db,
        organization_id=organization_id,
        search=search,
    )

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


async def retrieve_deal(
    db: AsyncSurreal,
    deal_id: str,
    organization_id: str,
):
    result = await get_deal_by_id(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
    )

    if not result:
        return None

    return result[0]


async def add_deal(
    db: AsyncSurreal,
    organization_id: str,
    owner_id: str,
    title: str,
    value,
    currency: str,
    stage_id: str,
    company_id: str | None,
    contact_id: str | None,
    expected_close_date,
):
    valid = await validate_related_records(
        db=db,
        organization_id=organization_id,
        stage_id=stage_id,
        company_id=company_id,
        contact_id=contact_id,
    )

    if not valid:
        return None

    data = {
        "title": title,
        "value": value,
        "currency": currency,
        "stage_id": stage_id,
        "company_id": company_id,
        "contact_id": contact_id,
        "expected_close_date": expected_close_date,
        "organization_id": organization_id,
        "owner_id": owner_id,
    }

    result = await create_deal(
        db=db,
        data=data,
    )

    if not result:
        return None

    return result[0]


async def edit_deal(
    db: AsyncSurreal,
    deal_id: str,
    organization_id: str,
    actor_id: str,
    title: str,
    value,
    currency: str,
    stage_id: str,
    status: str,
    company_id: str | None,
    contact_id: str | None,
    expected_close_date,
):
    existing = await retrieve_deal(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
    )

    if not existing:
        return None

    valid = await validate_related_records(
        db=db,
        organization_id=organization_id,
        stage_id=stage_id,
        company_id=company_id,
        contact_id=contact_id,
    )

    if not valid:
        return None

    data = {
        "title": title,
        "value": value,
        "currency": currency,
        "stage_id": stage_id,
        "status": status,
        "company_id": company_id,
        "contact_id": contact_id,
        "expected_close_date": expected_close_date,
        "updated_at": datetime.now(timezone.utc),
    }

    result = await update_deal(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
        data=data,
    )

    if not result:
        return None

    owner_id = existing.get("owner_id")

    if (
        owner_id
        and normalize_record_id(owner_id)
        != normalize_record_id(actor_id)
    ):
        await send_notification(
            db=db,
            user_id=str(owner_id),
            organization_id=organization_id,
            notification_type="DEAL_UPDATED",
            title="มีการแก้ไขดีล",
            message=f'ดีล "{existing.get("title", "")}" ได้รับการแก้ไขแล้ว',
            entity_type="deal",
            entity_id=deal_id,
        )

    return result[0]


async def remove_deal(
    db: AsyncSurreal,
    deal_id: str,
    organization_id: str,
):
    existing = await retrieve_deal(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
    )

    if not existing:
        return None

    return await delete_deal(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
    )
