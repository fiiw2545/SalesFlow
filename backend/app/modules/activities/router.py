from fastapi import APIRouter, Depends, HTTPException, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db

from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.activities.schemas import (
    ActivityCreate,
    ActivityUpdate,
    ActivityResponse,
)

from app.modules.activities.service import (
    list_activities,
    retrieve_activity,
    add_activity,
    edit_activity,
    remove_activity,
)


router = APIRouter(
    prefix="/activities",
    tags=["Activities"],
)


@router.get(
    "/",
    response_model=list[ActivityResponse],
)
async def get_all_activities(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_activities(
        db=db,
        organization_id=organization_id,
    )


@router.post(
    "/",
    response_model=ActivityResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_activity(
    payload: ActivityCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await add_activity(
        db=db,
        organization_id=organization_id,
        performed_by=str(current_user["id"]),
        subject=payload.subject,
        type=payload.type,
        description=payload.description,
        deal_id=payload.deal_id,
        contact_id=payload.contact_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal or Contact not found in this organization",
        )

    return result


@router.get(
    "/{activity_id}",
    response_model=ActivityResponse,
)
async def get_one_activity(
    activity_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await retrieve_activity(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    return result


@router.put(
    "/{activity_id}",
    response_model=ActivityResponse,
)
async def update_existing_activity(
    activity_id: str,
    payload: ActivityUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await edit_activity(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
        subject=payload.subject,
        type=payload.type,
        description=payload.description,
        deal_id=payload.deal_id,
        contact_id=payload.contact_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity or related resource not found",
        )

    return result


@router.delete(
    "/{activity_id}",
)
async def delete_existing_activity(
    activity_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await remove_activity(
        db=db,
        activity_id=activity_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Activity not found",
        )

    return {
        "message": "Activity deleted successfully"
    }