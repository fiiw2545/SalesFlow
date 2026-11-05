
from datetime import datetime, timezone

from fastapi import HTTPException, status
from surrealdb import AsyncSurreal

from app.modules.pipelines.repository import (
    get_pipelines,
    get_pipeline_by_id,
    pipeline_name_exists,
    clear_other_default_pipelines,
    pipeline_has_stages,
    create_pipeline,
    update_pipeline,
    delete_pipeline,
)


async def list_pipelines(
    db: AsyncSurreal,
    organization_id: str,
):
    return await get_pipelines(
        db=db,
        organization_id=organization_id,
    )


async def retrieve_pipeline(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
):
    return await get_pipeline_by_id(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )


async def add_pipeline(
    db: AsyncSurreal,
    name: str,
    description: str | None,
    is_default: bool,
    organization_id: str,
    created_by: str,
):
    if await pipeline_name_exists(
        db=db,
        organization_id=organization_id,
        name=name,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pipeline name already exists in this organization",
        )

    if is_default:
        await clear_other_default_pipelines(
            db=db,
            organization_id=organization_id,
        )

    data = {
        "name": name,
        "description": description,
        "is_default": is_default,
        "organization_id": organization_id,
        "created_by": created_by,
    }

    result = await create_pipeline(
        db=db,
        data=data,
    )

    return result


async def edit_pipeline(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
    name: str,
    description: str | None,
    is_default: bool,
):
    existing = await retrieve_pipeline(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not existing:
        return None

    if await pipeline_name_exists(
        db=db,
        organization_id=organization_id,
        name=name,
        exclude_pipeline_id=pipeline_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Pipeline name already exists in this organization",
        )

    if is_default:
        await clear_other_default_pipelines(
            db=db,
            organization_id=organization_id,
            exclude_pipeline_id=pipeline_id,
        )

    data = {
        "name": name,
        "description": description,
        "is_default": is_default,
        "updated_at": datetime.now(timezone.utc),
    }

    return await update_pipeline(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
        data=data,
    )


async def remove_pipeline(
    db: AsyncSurreal,
    pipeline_id: str,
    organization_id: str,
):
    existing = await retrieve_pipeline(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )

    if not existing:
        return None

    if await pipeline_has_stages(
        db=db,
        pipeline_id=pipeline_id,
    ):
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete pipeline because it still has stages",
        )

    return await delete_pipeline(
        db=db,
        pipeline_id=pipeline_id,
        organization_id=organization_id,
    )
