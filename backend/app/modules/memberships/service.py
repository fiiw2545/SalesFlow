
from fastapi import HTTPException
from surrealdb import AsyncSurreal

from app.modules.memberships.repository import (
    get_user,
    get_memberships,
    get_membership_by_id,
    get_membership_by_user_id,
    create_membership as repo_create_membership,
    update_membership as repo_update_membership,
    delete_membership as repo_delete_membership,
)


def require_admin(current_membership: dict):
    if current_membership.get("role") != "ADMIN":
        raise HTTPException(
            status_code=403,
            detail="Only ADMIN can manage memberships",
        )


async def get_all_memberships(
    db: AsyncSurreal,
    organization_id: str,
):
    items = await get_memberships(
        db=db,
        organization_id=organization_id,
    )

    return {"items": items}


async def get_membership(
    db: AsyncSurreal,
    membership_id: str,
    organization_id: str,
):
    membership = await get_membership_by_id(
        db=db,
        membership_id=membership_id,
        organization_id=organization_id,
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Membership not found",
        )

    return membership


async def create_membership(
    db: AsyncSurreal,
    user_id: str,
    organization_id: str,
    role: str,
    current_membership: dict,
):
    require_admin(current_membership)

    user = await get_user(
        db=db,
        user_id=user_id,
    )

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    existing = await get_membership_by_user_id(
        db=db,
        user_id=user_id,
        organization_id=organization_id,
    )

    if existing:
        raise HTTPException(
            status_code=409,
            detail="User is already a member of this organization",
        )

    try:
        membership = await repo_create_membership(
            db=db,
            user_id=user_id,
            organization_id=organization_id,
            role=role,
        )
    except Exception as error:
        if "unique index" in str(error).lower():
            raise HTTPException(
                status_code=409,
                detail="User is already a member of this organization",
            )

        raise

    if not membership:
        raise HTTPException(
            status_code=500,
            detail="Failed to create membership",
        )

    return membership


async def update_membership(
    db: AsyncSurreal,
    membership_id: str,
    organization_id: str,
    role: str,
    current_membership: dict,
):
    require_admin(current_membership)

    membership = await get_membership_by_id(
        db=db,
        membership_id=membership_id,
        organization_id=organization_id,
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Membership not found",
        )

    if membership["role"] == "ADMIN" and role != "ADMIN":
        all_members = await get_memberships(
            db=db,
            organization_id=organization_id,
        )

        admin_count = sum(
            1 for item in all_members
            if item.get("role") == "ADMIN"
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=409,
                detail="Cannot remove the last ADMIN",
            )

    updated = await repo_update_membership(
        db=db,
        membership_id=membership_id,
        role=role,
    )

    if not updated:
        raise HTTPException(
            status_code=404,
            detail="Membership not found",
        )

    return updated


async def delete_membership(
    db: AsyncSurreal,
    membership_id: str,
    organization_id: str,
    current_membership: dict,
):
    require_admin(current_membership)

    membership = await get_membership_by_id(
        db=db,
        membership_id=membership_id,
        organization_id=organization_id,
    )

    if not membership:
        raise HTTPException(
            status_code=404,
            detail="Membership not found",
        )

    if membership["role"] == "ADMIN":
        all_members = await get_memberships(
            db=db,
            organization_id=organization_id,
        )

        admin_count = sum(
            1 for item in all_members
            if item.get("role") == "ADMIN"
        )

        if admin_count <= 1:
            raise HTTPException(
                status_code=409,
                detail="Cannot remove the last ADMIN",
            )

    deleted = await repo_delete_membership(
        db=db,
        membership_id=membership_id,
    )

    if not deleted:
        raise HTTPException(
            status_code=404,
            detail="Membership not found",
        )

    return {
        "message": "Membership deleted successfully"
    }
