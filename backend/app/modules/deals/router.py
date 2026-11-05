
from fastapi import APIRouter, Depends, HTTPException, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db

from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.deals.schemas import (
    DealCreate,
    DealUpdate,
    DealResponse,
)

from app.modules.deals.service import (
    list_deals,
    retrieve_deal,
    add_deal,
    edit_deal,
    remove_deal,
)


router = APIRouter(
    prefix="/deals",
    tags=["Deals"],
)


@router.get(
    "/",
    response_model=list[DealResponse],
)
async def get_all_deals(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_deals(
        db=db,
        organization_id=organization_id,
    )


@router.post(
    "/",
    response_model=DealResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_deal(
    payload: DealCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await add_deal(
        db=db,
        organization_id=organization_id,
        owner_id=str(current_user["id"]),
        title=payload.title,
        value=payload.value,
        currency=payload.currency,
        stage_id=payload.stage_id,
        company_id=payload.company_id,
        contact_id=payload.contact_id,
        expected_close_date=payload.expected_close_date,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Stage, Company, or Contact not found in this organization",
        )

    return result


@router.get(
    "/{deal_id}",
    response_model=DealResponse,
)
async def get_one_deal(
    deal_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await retrieve_deal(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )

    return result


@router.put(
    "/{deal_id}",
    response_model=DealResponse,
)
async def update_existing_deal(
    deal_id: str,
    payload: DealUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await edit_deal(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
        title=payload.title,
        value=payload.value,
        currency=payload.currency,
        stage_id=payload.stage_id,
        status=payload.status,
        company_id=payload.company_id,
        contact_id=payload.contact_id,
        expected_close_date=payload.expected_close_date,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal or related resource not found",
        )

    return result


@router.delete(
    "/{deal_id}",
)
async def delete_existing_deal(
    deal_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await remove_deal(
        db=db,
        deal_id=deal_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal not found",
        )

    return {
        "message": "Deal deleted successfully"
    }
