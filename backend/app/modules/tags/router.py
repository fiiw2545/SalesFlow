from fastapi import APIRouter, Depends, HTTPException, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.tags.schemas import (
    TagCreate,
    TagUpdate,
    TagResponse,
    TagAssignmentCreate,
    TagAssignmentResponse,
)

from app.modules.tags.service import (
    list_tags,
    retrieve_tag,
    add_tag,
    edit_tag,
    remove_tag,
    list_company_tags,
    assign_company_tag,
    unassign_company_tag,
    list_contact_tags,
    assign_contact_tag,
    unassign_contact_tag,
)


router = APIRouter(
    prefix="/tags",
    tags=["Tags"],
)


def raise_assignment_error(result):
    if result == "duplicate":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This tag is already assigned",
        )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag or related resource not found in this organization",
        )


# -------------------------
# Tag CRUD
# -------------------------

@router.get("/", response_model=list[TagResponse])
async def get_all_tags(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_tags(
        db=db,
        organization_id=organization_id,
    )


@router.post(
    "/",
    response_model=TagResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_tag(
    data: TagCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await add_tag(
        db=db,
        data=data.model_dump(),
        organization_id=organization_id,
    )

    return result


@router.get("/{tag_id}", response_model=TagResponse)
async def get_tag(
    tag_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await retrieve_tag(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    return result


@router.put("/{tag_id}", response_model=TagResponse)
async def update_existing_tag(
    tag_id: str,
    data: TagUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await edit_tag(
        db=db,
        tag_id=tag_id,
        data=data.model_dump(),
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    return result


@router.delete("/{tag_id}")
async def delete_existing_tag(
    tag_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await remove_tag(
        db=db,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Tag not found",
        )

    if result == "in_use":
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Cannot delete tag because it is assigned to companies or contacts",
        )

    return {"message": "Tag deleted successfully"}


# -------------------------
# Company Tags
# -------------------------

@router.get(
    "/companies/{company_id}",
    response_model=list[TagAssignmentResponse],
)
async def get_tags_for_company(
    company_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await list_company_tags(
        db=db,
        company_id=company_id,
        organization_id=organization_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company not found",
        )

    return result


@router.post(
    "/companies/{company_id}",
    response_model=TagAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_tag_to_company(
    company_id: str,
    data: TagAssignmentCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await assign_company_tag(
        db=db,
        company_id=company_id,
        tag_id=data.tag_id,
        organization_id=organization_id,
    )

    raise_assignment_error(result)

    return result


@router.delete("/companies/{company_id}/{tag_id}")
async def remove_tag_from_company(
    company_id: str,
    tag_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await unassign_company_tag(
        db=db,
        company_id=company_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company tag assignment not found",
        )

    return {"message": "Tag removed from company successfully"}


# -------------------------
# Contact Tags
# -------------------------

@router.get(
    "/contacts/{contact_id}",
    response_model=list[TagAssignmentResponse],
)
async def get_tags_for_contact(
    contact_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await list_contact_tags(
        db=db,
        contact_id=contact_id,
        organization_id=organization_id,
    )

    if result is None:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found",
        )

    return result


@router.post(
    "/contacts/{contact_id}",
    response_model=TagAssignmentResponse,
    status_code=status.HTTP_201_CREATED,
)
async def add_tag_to_contact(
    contact_id: str,
    data: TagAssignmentCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await assign_contact_tag(
        db=db,
        contact_id=contact_id,
        tag_id=data.tag_id,
        organization_id=organization_id,
    )

    raise_assignment_error(result)

    return result


@router.delete("/contacts/{contact_id}/{tag_id}")
async def remove_tag_from_contact(
    contact_id: str,
    tag_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await unassign_contact_tag(
        db=db,
        contact_id=contact_id,
        tag_id=tag_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact tag assignment not found",
        )

    return {"message": "Tag removed from contact successfully"}