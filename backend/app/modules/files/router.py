
from urllib.parse import quote

from fastapi import (
    APIRouter,
    Depends,
    File,
    Query,
    UploadFile,
)
from fastapi.responses import Response

from surrealdb import AsyncSurreal

from app.database.dependencies import get_db

from app.security.dependencies import (
    get_current_user,
    get_current_user_id,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.files import service

from app.modules.files.schemas import (
    FileResponse,
    FileListResponse,
    FileDeleteResponse,
)


router = APIRouter(
    prefix="/files",
    tags=["Files"],
)


@router.post(
    "/upload",
    response_model=FileResponse,
    status_code=201,
)
async def upload_file(
    file: UploadFile = File(...),
    db: AsyncSurreal = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    user_id: str = Depends(get_current_user_id),
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
):
    return await service.upload_file(
        db=db,
        file=file,
        organization_id=organization_id,
        user_id=user_id,
    )


@router.get(
    "/",
    response_model=FileListResponse,
)
async def read_files(
    limit: int = Query(default=20, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: AsyncSurreal = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
):
    return await service.list_files(
        db=db,
        organization_id=organization_id,
        limit=limit,
        offset=offset,
    )


@router.get(
    "/{file_id}",
    response_model=FileResponse,
)
async def read_file(
    file_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
):
    return await service.get_file_detail(
        db=db,
        file_id=file_id,
        organization_id=organization_id,
    )


@router.get("/{file_id}/download")
async def download_file(
    file_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
):
    metadata, content = await service.download_file(
        db=db,
        file_id=file_id,
        organization_id=organization_id,
    )

    filename = quote(metadata["original_name"])

    return Response(
        content=content,
        media_type=metadata["content_type"],
        headers={
            "Content-Disposition": (
                f"attachment; filename*=UTF-8''{filename}"
            ),
            "Content-Length": str(len(content)),
            "X-Content-Type-Options": "nosniff",
        },
    )

@router.delete("/avatar")
async def delete_user_avatar(
    db: AsyncSurreal = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await service.remove_avatar(
        db=db,
        user_id=user_id,
    )


@router.delete(
    "/{file_id}",
    response_model=FileDeleteResponse,
)
async def delete_file(
    file_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user: dict = Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
):
    return await service.remove_file(
        db=db,
        file_id=file_id,
        organization_id=organization_id,
    )


@router.post(
    "/avatar/upload",
    response_model=FileResponse,
    status_code=201,
)
async def upload_user_avatar(
    file: UploadFile = File(...),
    db: AsyncSurreal = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    return await service.upload_avatar(
        db=db,
        file=file,
        user_id=user_id,
    )


@router.get("/avatar/{file_id}/download")
async def download_user_avatar(
    file_id: str,
    db: AsyncSurreal = Depends(get_db),
    user_id: str = Depends(get_current_user_id),
):
    metadata, content = await service.download_avatar(
        db=db,
        file_id=file_id,
        user_id=user_id,
    )

    filename = quote(metadata["original_name"])

    return Response(
        content=content,
        media_type=metadata["content_type"],
        headers={
            "Content-Disposition": (
                f"inline; filename*=UTF-8''{filename}"
            ),
            "Content-Length": str(len(content)),
            "X-Content-Type-Options": "nosniff",
            "Cache-Control": "private, no-store",
        },
)