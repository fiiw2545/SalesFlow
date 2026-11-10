
from fastapi import APIRouter, Depends, status, Query
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_organization_id,
    get_current_membership,
)

from app.modules.memberships.schemas import (
    MembershipCreate,
    MembershipUpdate,
    MembershipResponse,
    MembershipListResponse,
    MembershipDeleteResponse,
)

from app.modules.memberships.service import (
    get_all_memberships,
    get_membership,
    create_membership,
    update_membership,
    delete_membership,
)


router = APIRouter(
    prefix="/memberships",
    tags=["Memberships"],
)


@router.get(
    "/",
    response_model=MembershipListResponse,
)
async def get_memberships_endpoint(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    current_membership=Depends(get_current_membership),
):
    return await get_all_memberships(
        db=db,
        organization_id=organization_id,
        page=page,
        limit=limit,
    )


@router.get(
    "/{membership_id}",
    response_model=MembershipResponse,
)
async def get_membership_endpoint(
    membership_id: str,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    current_membership=Depends(get_current_membership),
):
    return await get_membership(
        db=db,
        membership_id=membership_id,
        organization_id=organization_id,
    )


@router.post(
    "/",
    response_model=MembershipResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_membership_endpoint(
    data: MembershipCreate,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    current_membership=Depends(get_current_membership),
):
    return await create_membership(
        db=db,
        user_id=data.user_id,
        organization_id=organization_id,
        role=data.role,
        current_membership=current_membership,
    )


@router.patch(
    "/{membership_id}",
    response_model=MembershipResponse,
)
async def update_membership_endpoint(
    membership_id: str,
    data: MembershipUpdate,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    current_membership=Depends(get_current_membership),
):
    return await update_membership(
        db=db,
        membership_id=membership_id,
        organization_id=organization_id,
        role=data.role,
        current_membership=current_membership,
    )


@router.delete(
    "/{membership_id}",
    response_model=MembershipDeleteResponse,
)
async def delete_membership_endpoint(
    membership_id: str,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    current_membership=Depends(get_current_membership),
):
    return await delete_membership(
        db=db,
        membership_id=membership_id,
        organization_id=organization_id,
        current_membership=current_membership,
    )
