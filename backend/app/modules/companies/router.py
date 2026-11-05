from fastapi import APIRouter, Depends, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.companies.schemas import (
    CompanyCreate,
    CompanyUpdate,
    CompanyResponse,
    CompanyListResponse,
    CompanyDeleteResponse,
)

from app.modules.companies.service import (
    list_companies,
    get_company,
    create_new_company,
    update_existing_company,
    delete_existing_company,
)


router = APIRouter(
    prefix="/companies",
    tags=["Companies"],
)


@router.get(
    "/",
    response_model=CompanyListResponse,
)
async def read_companies(
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_companies(
        db=db,
        organization_id=organization_id,
    )


@router.get(
    "/{company_id}",
    response_model=CompanyResponse,
)
async def read_company(
    company_id: str,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await get_company(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )


@router.post(
    "/",
    response_model=CompanyResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_company_endpoint(
    payload: CompanyCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await create_new_company(
        db=db,
        data=payload.model_dump(),
        organization_id=organization_id,
        current_user=current_user,
    )


@router.patch(
    "/{company_id}",
    response_model=CompanyResponse,
)
async def update_company_endpoint(
    company_id: str,
    payload: CompanyUpdate,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await update_existing_company(
        db=db,
        company_id=company_id,
        data=payload.model_dump(exclude_unset=True),
        organization_id=organization_id,
    )


@router.delete(
    "/{company_id}",
    response_model=CompanyDeleteResponse,
)
async def delete_company_endpoint(
    company_id: str,
    db: AsyncSurreal = Depends(get_db),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await delete_existing_company(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )