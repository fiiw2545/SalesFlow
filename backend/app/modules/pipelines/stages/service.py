
from datetime import datetime, timezone
from fastapi import HTTPException, status
from surrealdb import AsyncSurreal

from app.modules.pipelines.repository import get_pipeline_by_id
from app.modules.pipelines.stages.repository import (
    get_stages,
    get_stage_by_id,
    stage_name_exists,
    stage_position_exists,
    create_stage,
    update_stage,
    delete_stage,
)
from app.modules.deals.repository import get_deals_by_stage_id


async def ensure_pipeline_access(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
):
    clean_pipeline_id = pipeline_id

    if ":" in clean_pipeline_id:
        clean_pipeline_id = clean_pipeline_id.split(":", 1)[1]

    result = await get_pipeline_by_id(
        db=db,
        pipeline_id=clean_pipeline_id,
        organization_id=organization_id,
    )

    if not result:
        return None

    return result[0]


async def validate_stage_unique(
    db: AsyncSurreal,
    pipeline_id: str,
    name: str,
    position: int,
    exclude_stage_id: str | None = None,
):
    duplicate_name = await stage_name_exists(
        db=db,
        pipeline_id=pipeline_id,
        name=name,
        exclude_stage_id=exclude_stage_id,
    )

    if duplicate_name:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stage name already exists in this pipeline",
        )

    duplicate_position = await stage_position_exists(
        db=db,
        pipeline_id=pipeline_id,
        position=position,
        exclude_stage_id=exclude_stage_id,
    )

    if duplicate_position:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Stage position already exists in this pipeline",
        )


async def list_stages(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
):
    pipeline = await ensure_pipeline_access(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not pipeline:
        return None

    return await get_stages(
        db=db,
        pipeline_id=pipeline_id,
    )


async def retrieve_stage(
    db: AsyncSurreal,
    stage_id: str,
    pipeline_id: str,
    organization_id: str,
):
    pipeline = await ensure_pipeline_access(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not pipeline:
        return None

    result = await get_stage_by_id(
        db=db,
        stage_id=stage_id,
        pipeline_id=pipeline_id,
    )

    if not result:
        return None

    return result[0]


async def add_stage(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
    name: str,
    position: int,
    probability: int,
):
    pipeline = await ensure_pipeline_access(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not pipeline:
        return None

    await validate_stage_unique(
        db=db,
        pipeline_id=pipeline_id,
        name=name,
        position=position,
    )

    data = {
        "name": name,
        "position": position,
        "probability": probability,
    }

    result = await create_stage(
        db=db,
        pipeline_id=pipeline_id,
        data=data,
    )

    if not result:
        return None

    return result[0]


async def edit_stage(
    db: AsyncSurreal,
    stage_id: str,
    pipeline_id: str,
    organization_id: str,
    name: str,
    position: int,
    probability: int,
):
    existing = await retrieve_stage(
        db=db,
        stage_id=stage_id,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not existing:
        return None

    await validate_stage_unique(
        db=db,
        pipeline_id=pipeline_id,
        name=name,
        position=position,
        exclude_stage_id=stage_id,
    )

    data = {
        "name": name,
        "position": position,
        "probability": probability,
        "updated_at": datetime.now(timezone.utc),
    }

    result = await update_stage(
        db=db,
        stage_id=stage_id,
        pipeline_id=pipeline_id,
        data=data,
    )

    if not result:
        return None

    return result[0]


async def remove_stage(
    db: AsyncSurreal,
    stage_id: str,
    pipeline_id: str,
    organization_id: str,
):
    existing = await ensure_pipeline_access(
        db,
        pipeline_id,
        organization_id,
    )

    stage = await get_stage_by_id(
    db,
    stage_id,
    pipeline_id,
)

    if not stage:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage not found",
        )

    deals = await get_deals_by_stage_id(
        db,
        stage_id,
        organization_id,
    )

    if deals:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete stage because it is used by deals",
        )

    await delete_stage(
    db,
    stage_id,
    pipeline_id,
)

    return {"message": "Stage deleted successfully"}