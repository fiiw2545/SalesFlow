from fastapi import APIRouter, Depends, HTTPException, status
from surrealdb import AsyncSurreal
from app.common.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
    require_roles,
)
from app.database.dependencies import get_db
from app.schemas.role import UserRole

from app.modules.pipelines.stages.schemas import (
    StageCreate,
    StageUpdate,
    StageResponse,
)

from app.modules.pipelines.stages.service import (
    list_stages,
    retrieve_stage,
    add_stage,
    edit_stage,
    remove_stage,
)


router = APIRouter(
    prefix="/{pipeline_id}/stages",
    tags=["Stages"],
)


@router.get(
    "/",
    response_model=list[StageResponse],
)
async def get_all_stages(
    pipeline_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await list_stages(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found",
        )

    return result


@router.post(
    "/",
    response_model=StageResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_stage(
    pipeline_id: str,
    payload: StageCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    result = await add_stage(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
        name=payload.name,
        position=payload.position,
        probability=payload.probability,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found",
        )

    return result


@router.get(
    "/{stage_id}",
    response_model=StageResponse,
)
async def get_one_stage(
    pipeline_id: str,
    stage_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await retrieve_stage(
        db=db,
        stage_id=stage_id,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found",
        )

    return result


@router.put(
    "/{stage_id}",
    response_model=StageResponse,
)
async def update_existing_stage(
    pipeline_id: str,
    stage_id: str,
    payload: StageUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    result = await edit_stage(
        db=db,
        stage_id=stage_id,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
        name=payload.name,
        position=payload.position,
        probability=payload.probability,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage or Pipeline not found",
        )

    return result


@router.delete(
    "/{stage_id}",
)
async def delete_existing_stage(
    pipeline_id: str,
    stage_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    result = await remove_stage(
        db=db,
        stage_id=stage_id,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found",
        )

    return {
        "message": "Stage deleted successfully"
    }
