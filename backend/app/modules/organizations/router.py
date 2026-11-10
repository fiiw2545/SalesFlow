from fastapi import (
    APIRouter,
    Depends,
    HTTPException,
    status,
    Query,
)
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import get_current_user

from app.modules.organizations.schemas import (
    OrganizationCreate,
    OrganizationUpdate,
    OrganizationResponse,
    OrganizationListResponse,
    OrganizationCreateResponse,
    OrganizationDeleteResponse,
)

from app.modules.organizations.service import (
    create_organization,
    list_organizations,
    get_organization,
    update_organization,
    delete_organization,
)


router = APIRouter(
    prefix="/organizations",
    tags=["Organizations"],
)


def handle_service_error(error):
    if isinstance(error, PermissionError):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(error),
        )

    if isinstance(error, LookupError):
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=str(error),
        )

    if isinstance(error, ValueError):
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=str(error),
        )

    raise error


@router.post(
    "/",
    response_model=OrganizationCreateResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_organization_endpoint(
    data: OrganizationCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return await create_organization(
            db=db,
            data=data,
            current_user=current_user,
        )
    except Exception as error:
        handle_service_error(error)


@router.get(
    "/",
    response_model=OrganizationListResponse,
)
async def list_organizations_endpoint(
    page: int = Query(default=1, ge=1),
    limit: int = Query(default=10, ge=1, le=100),
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return await list_organizations(
            db=db,
            current_user=current_user,
            page=page,
            limit=limit,
        )
    except Exception as error:
        handle_service_error(error)


@router.get(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
async def get_organization_endpoint(
    organization_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return await get_organization(
            db=db,
            organization_id=organization_id,
            current_user=current_user,
        )
    except Exception as error:
        handle_service_error(error)


@router.put(
    "/{organization_id}",
    response_model=OrganizationResponse,
)
async def update_organization_endpoint(
    organization_id: str,
    data: OrganizationUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return await update_organization(
            db=db,
            organization_id=organization_id,
            data=data,
            current_user=current_user,
        )
    except Exception as error:
        handle_service_error(error)


@router.delete(
    "/{organization_id}",
    response_model=OrganizationDeleteResponse,
)
async def delete_organization_endpoint(
    organization_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
):
    try:
        return await delete_organization(
            db=db,
            organization_id=organization_id,
            current_user=current_user,
        )
    except Exception as error:
        handle_service_error(error)
