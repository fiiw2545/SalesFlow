
from fastapi import APIRouter, Depends, status, HTTPException
from surrealdb import AsyncSurreal
from app.database.dependencies import get_db
from app.common.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
    require_roles,
)
from app.schemas.role import UserRole
from app.modules.pipelines.schemas import (
    PipelineCreate,
    PipelineUpdate,
    PipelineResponse,
)
from app.modules.pipelines.service import (
    add_pipeline,
    list_pipelines,
    retrieve_pipeline,
    edit_pipeline,
    remove_pipeline,
)
from app.modules.pipelines.stages.router import router as stages_router


router = APIRouter(
    prefix="/pipelines",
    tags=["Pipelines"],
)


@router.post(
    "/",
    status_code=status.HTTP_201_CREATED,
    response_model=PipelineResponse,
)
async def create_pipeline_endpoint(
    payload: PipelineCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    result = await add_pipeline(
        db=db,
        name=payload.name,
        description=payload.description,
        is_default=payload.is_default,
        organization_id=organization_id,
        created_by=str(current_user["id"]),
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create pipeline",
        )

    return result[0]


@router.get(
    "/",
    status_code=status.HTTP_200_OK,
    response_model=list[PipelineResponse],
)
async def get_pipelines_endpoint(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_pipelines(
        db=db,
        organization_id=organization_id,
    )


@router.get(
    "/{pipeline_id}",
    status_code=status.HTTP_200_OK,
    response_model=PipelineResponse,
)
async def get_pipeline_endpoint(
    pipeline_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await retrieve_pipeline(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found",
        )

    return result[0]


@router.put(
    "/{pipeline_id}",
    status_code=status.HTTP_200_OK,
    response_model=PipelineResponse,
)
async def update_pipeline_endpoint(
    pipeline_id: str,
    payload: PipelineUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    result = await edit_pipeline(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
        name=payload.name,
        description=payload.description,
        is_default=payload.is_default,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found",
        )

    return result[0]


@router.delete(
    "/{pipeline_id}",
    status_code=status.HTTP_200_OK,
)
async def delete_pipeline_endpoint(
    pipeline_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(
        require_roles(UserRole.ADMIN, UserRole.MANAGER)
    ),
):
    result = await remove_pipeline(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pipeline not found",
        )

    return {
        "message": "Pipeline deleted successfully",
    }


router.include_router(stages_router)
