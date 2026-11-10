from surrealdb import AsyncSurreal

from app.modules.tags.repository import (
    get_tag_usage,
    count_tags,
    get_tags,
    get_tag_by_id,
    create_tag,
    update_tag,
    delete_tag,
    get_company_by_id,
    get_contact_by_id,
    get_company_tags,
    get_company_tag_link,
    create_company_tag,
    delete_company_tag,
    get_contact_tags,
    get_contact_tag_link,
    create_contact_tag,
    delete_contact_tag,
)


# -------------------------
# Tag CRUD
# -------------------------

async def list_tags(
    db: AsyncSurreal,
    organization_id: str,
    page: int = 1,
    limit: int = 10,
):
    items = await get_tags(
        db=db,
        organization_id=organization_id,
        page=page,
        limit=limit,
    )

    total = await count_tags(
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


async def retrieve_tag(
    db: AsyncSurreal,
    tag_id: str,
    organization_id: str,
):
    result = await get_tag_by_id(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    return result[0] if result else None


async def add_tag(
    db: AsyncSurreal,
    data: dict,
    organization_id: str,
):
    tag_data = {
        "name": data["name"],
        "color": data.get("color"),
        "organization_id": organization_id,
    }

    result = await create_tag(
        db=db,
        data=tag_data,
    )

    return result[0] if result else None


async def edit_tag(
    db: AsyncSurreal,
    tag_id: str,
    data: dict,
    organization_id: str,
):
    existing_tag = await retrieve_tag(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not existing_tag:
        return None

    tag_data = {
        "name": data["name"],
        "color": data.get("color"),
    }

    result = await update_tag(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
        data=tag_data,
    )

    return result[0] if result else None


async def remove_tag(
    db: AsyncSurreal,
    tag_id: str,
    organization_id: str,
):
    existing_tag = await retrieve_tag(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not existing_tag:
        return None

    usage = await get_tag_usage(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if usage["companies"] or usage["contacts"]:
        return "in_use"

    result = await delete_tag(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    return result[0] if result else None


# -------------------------
# Company Tags
# -------------------------

async def list_company_tags(
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
        return None

    return await get_company_tags(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )


async def assign_company_tag(
    db: AsyncSurreal,
    company_id: str,
    tag_id: str,
    organization_id: str,
):
    company = await get_company_by_id(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    if not company:
        return None

    tag = await get_tag_by_id(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not tag:
        return None

    existing_link = await get_company_tag_link(
        db=db,
        company_id=company_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if existing_link:
        return "duplicate"

    result = await create_company_tag(
        db=db,
        company_id=company_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    return result[0] if result else None


async def unassign_company_tag(
    db: AsyncSurreal,
    company_id: str,
    tag_id: str,
    organization_id: str,
):
    existing_link = await get_company_tag_link(
        db=db,
        company_id=company_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not existing_link:
        return None

    result = await delete_company_tag(
        db=db,
        company_id=company_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    return result[0] if result else None


# -------------------------
# Contact Tags
# -------------------------

async def list_contact_tags(
    db: AsyncSurreal,
    contact_id: str,
    organization_id: str,
):
    contact = await get_contact_by_id(
        db=db,
        contact_id=contact_id,
        organization_id=organization_id,
    )

    if not contact:
        return None

    return await get_contact_tags(
        db=db,
        contact_id=contact_id,
        organization_id=organization_id,
    )


async def assign_contact_tag(
    db: AsyncSurreal,
    contact_id: str,
    tag_id: str,
    organization_id: str,
):
    contact = await get_contact_by_id(
        db=db,
        contact_id=contact_id,
        organization_id=organization_id,
    )

    if not contact:
        return None

    tag = await get_tag_by_id(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not tag:
        return None

    existing_link = await get_contact_tag_link(
        db=db,
        contact_id=contact_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if existing_link:
        return "duplicate"

    result = await create_contact_tag(
        db=db,
        contact_id=contact_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    return result[0] if result else None


async def unassign_contact_tag(
    db: AsyncSurreal,
    contact_id: str,
    tag_id: str,
    organization_id: str,
):
    existing_link = await get_contact_tag_link(
        db=db,
        contact_id=contact_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not existing_link:
        return None

    result = await delete_contact_tag(
        db=db,
        contact_id=contact_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    return result[0] if result else None