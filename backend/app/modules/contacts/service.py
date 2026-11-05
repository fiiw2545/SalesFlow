from fastapi import HTTPException
from surrealdb import AsyncSurreal

from app.modules.contacts import repository


def has_company(result) -> bool:
    """
    ตรวจสอบว่าผลลัพธ์จาก SurrealDB มี Company หรือไม่
    รองรับทั้ง direct list และ statement result
    """

    if not isinstance(result, list):
        return False

    for item in result:
        if not isinstance(item, dict):
            continue

        if "result" in item:
            rows = item["result"]

            if isinstance(rows, list) and len(rows) > 0:
                return True

            if isinstance(rows, dict) and rows:
                return True

        elif "id" in item:
            return True

    return False


async def validate_company(
    db: AsyncSurreal,
    company_id: str | None,
    organization_id: str,
):
    # ไม่ระบุบริษัท ถือว่าใช้งานได้
    if not company_id:
        return

    # ตรวจสอบรูปแบบ Record ID
    if not company_id.startswith("companies:"):
        raise HTTPException(
            status_code=404,
            detail="Company not found in this organization"
        )

    result = await repository.get_company_by_id(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    if not has_company(result):
        raise HTTPException(
            status_code=404,
            detail="Company not found in this organization"
        )


async def get_contacts(
    db: AsyncSurreal,
    organization_id: str
):
    return await repository.get_contacts(
        db,
        organization_id
    )


async def get_contact_by_id(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str
):
    return await repository.get_contact_by_id(
        db,
        contact_id,
        organization_id
    )


async def create_contact(
    db: AsyncSurreal,
    data: dict
):
    await validate_company(
        db=db,
        company_id=data.get("company_id"),
        organization_id=data["organization_id"],
    )

    return await repository.create_contact(
        db,
        data
    )


async def update_contact(
    db: AsyncSurreal,
    contact_id: str,
    data: dict,
    organization_id: str
):
    await validate_company(
        db=db,
        company_id=data.get("company_id"),
        organization_id=organization_id,
    )

    return await repository.update_contact(
        db,
        contact_id,
        data,
        organization_id
    )


async def delete_contact(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str
):
    return await repository.delete_contact(
        db,
        contact_id,
        organization_id
    )