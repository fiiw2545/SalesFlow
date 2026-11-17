from fastapi import APIRouter, Depends, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_user,
)

from app.modules.line import service
from app.modules.line.schemas import (
    LineLinkCodeResponse,
    LineStatusResponse,
    LineConnectionResponse,
)


router = APIRouter(
    prefix="/line",
    tags=["LINE"],
)


@router.post(
    "/link-code",
    response_model=LineLinkCodeResponse,
)
async def generate_line_link_code(
    current_user: dict = Depends(get_current_user),
    db: AsyncSurreal = Depends(get_db),
):
    return await service.create_link_code(
        db=db,
        user_id=str(current_user["id"]),
    )


@router.get(
    "/status",
    response_model=LineStatusResponse,
)
async def get_line_connection_status(
    current_user: dict = Depends(get_current_user),
    db: AsyncSurreal = Depends(get_db),
):
    return await service.get_line_status(
        db=db,
        user_id=str(current_user["id"]),
    )


@router.delete(
    "/connection",
    response_model=LineConnectionResponse,
)
async def disconnect_line_account(
    current_user: dict = Depends(get_current_user),
    db: AsyncSurreal = Depends(get_db),
):
    return await service.disconnect_line(
        db=db,
        user_id=str(current_user["id"]),
    )