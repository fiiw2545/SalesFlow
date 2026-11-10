from datetime import datetime, timezone
from surrealdb import AsyncSurreal
from fastapi import HTTPException

from app.modules.organizations.repository import (
    create_organization as repo_create_organization,
    get_user_organizations,
    get_organization_by_id,
    get_membership,
    update_organization as repo_update_organization,
    deactivate_organization,
)


def get_user_id(current_user) -> str:
    if isinstance(current_user, dict):
        user_id = current_user.get("id")
    else:
        user_id = getattr(current_user, "id", None)

    if not user_id:
        raise ValueError("User ID not found")

    return str(user_id)


async def create_organization(
    db: AsyncSurreal,
    data,
    current_user,
):
    user_id = get_user_id(current_user)

    organization = await repo_create_organization(
        db=db,
        name=data.name,
        slug=data.slug,
        user_id=user_id,
    )

    return {
        "organization": organization,
        "membership_role": "ADMIN",
    }


async def list_organizations(
    db: AsyncSurreal,
    current_user,
    page: int = 1,
    limit: int = 10,
):
    user_id = get_user_id(current_user)

    organizations = await get_user_organizations(
        db=db,
        user_id=user_id,
    )

    total = len(organizations)
    offset = (page - 1) * limit

    items = organizations[offset:offset + limit]

    return {
        "items": items,
        "total": total,
        "page": page,
        "limit": limit,
        "total_pages": (total + limit - 1) // limit,
    }


async def get_organization(
    db: AsyncSurreal,
    organization_id: str,
    current_user: dict,
):
    user_id = str(current_user["id"])
    # 1. Check organization first
    organization = await get_organization_by_id(
        db=db,
        organization_id=organization_id,
    )

    if not organization:
        raise HTTPException(
            status_code=404,
            detail="Organization not found",
        )

    # 2. Check membership
    membership = await get_membership(
        db=db,
        organization_id=organization_id,
        user_id=user_id,
    )

    if not membership:
        raise HTTPException(
            status_code=403,
            detail="You do not have access to this organization",
        )

    # 3. Return organization
    organization["role"] = membership["role"]

    return organization


async def update_organization(
    db: AsyncSurreal,
    organization_id: str,
    data,
    current_user,
):
    user_id = get_user_id(current_user)

    membership = await get_membership(
        db=db,
        organization_id=organization_id,
        user_id=user_id,
    )

    if not membership:
        raise PermissionError(
            "You are not a member of this organization"
        )

    if membership.get("role") != "ADMIN":
        raise PermissionError(
            "Only ADMIN can update organization"
        )

    update_data = data.model_dump(exclude_unset=True)

    if not update_data:
        raise ValueError("No fields to update")

    if any(value is None for value in update_data.values()):
        raise ValueError("Organization fields cannot be null")

    update_data["updated_at"] = datetime.now(timezone.utc)

    organization = await repo_update_organization(
        db=db,
        organization_id=organization_id,
        data=update_data,
    )

    if not organization:
        raise LookupError("Organization not found")

    return organization


async def delete_organization(
    db: AsyncSurreal,
    organization_id: str,
    current_user,
):
    user_id = get_user_id(current_user)

    membership = await get_membership(
        db=db,
        organization_id=organization_id,
        user_id=user_id,
    )

    if not membership:
        raise PermissionError(
            "You are not a member of this organization"
        )

    if membership.get("role") != "ADMIN":
        raise PermissionError(
            "Only ADMIN can deactivate organization"
        )

    organization = await get_organization_by_id(
        db=db,
        organization_id=organization_id,
    )

    if not organization:
        raise LookupError("Organization not found")

    if not organization.get("is_active", True):
        raise ValueError("Organization is already inactive")

    result = await deactivate_organization(
        db=db,
        organization_id=organization_id,
    )

    if not result:
        raise LookupError("Organization not found")

    return {
        "message": "Organization deactivated successfully"
    }
