from fastapi import HTTPException, status
from surrealdb import AsyncSurreal

from app.modules.companies.repository import (
    get_companies,
    count_companies,
    get_company_by_id,
    get_company_by_name,
    create_company,
    update_company,
    get_company_contacts,
    get_company_deals,
    delete_company,
)


async def list_companies(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
    search: str | None = None,
):
    search = search.strip().lower() if search else None
    search = search or None

    items = await get_companies(
        db=db,
        organization_id=organization_id,
        page=page,
        limit=limit,
        search=search,
    )

    total = await count_companies(
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


async def get_company(
    db: AsyncSurreal,
    company_id: str,
    organization_id: str,
):
    company = await get_company_by_id(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return company


async def create_new_company(
    db: AsyncSurreal,
    data: dict,
    organization_id: str,
    current_user,
):
    name = data["name"].strip()

    if not name:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="Company name cannot be empty",
        )

    existing_company = await get_company_by_name(
        db=db,
        name=name,
        organization_id=organization_id,
    )

    if existing_company:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Company name already exists in this organization",
        )

    data["name"] = name

    company = await create_company(
        db=db,
        data=data,
        organization_id=organization_id,
        user_id=str(current_user["id"]),
    )

    if not company:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Company creation returned no data",
        )

    return company


async def update_existing_company(
    db: AsyncSurreal,
    company_id: str,
    data: dict,
    organization_id: str,
):
    existing_company = await get_company(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    if "name" in data:
        if data["name"] is None:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Company name cannot be null",
            )

        name = data["name"].strip()

        if not name:
            raise HTTPException(
                status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
                detail="Company name cannot be empty",
            )

        duplicate = await get_company_by_name(
            db=db,
            name=name,
            organization_id=organization_id,
        )

        if duplicate and duplicate["id"] != existing_company["id"]:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Company name already exists in this organization",
            )

        data["name"] = name

    if not data:
        return existing_company

    updated_company = await update_company(
        db=db,
        company_id=company_id,
        data=data,
    )

    if not updated_company:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Company update returned no data",
        )

    return updated_company


async def delete_existing_company(
    db: AsyncSurreal,
    company_id: str,
    organization_id: str,
):
    await get_company(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    contacts = await get_company_contacts(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    if contacts:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete company because it has associated contacts",
        )

    deals = await get_company_deals(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    if deals:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete company because it has associated deals",
        )

    deleted_company = await delete_company(
        db=db,
        company_id=company_id,
    )

    if not deleted_company:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Company deletion returned no data",
        )

    return {
        "message": "Company deleted successfully",
    }