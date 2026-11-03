
from fastapi import APIRouter, Depends, HTTPException, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.modules.contacts.schemas import ContactCreate, ContactUpdate
from app.modules.contacts import service
from app.common.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership
)


router = APIRouter(
    prefix="/contacts",
    tags=["Contacts"]
)


@router.get("/")
async def get_contacts(
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
    db: AsyncSurreal = Depends(get_db)
):
    contacts = await service.get_contacts(
        db,
        organization_id
    )

    return {
        "message": "Contacts retrieved successfully",
        "data": contacts
    }


@router.get("/{contact_id}")
async def get_contact(
    contact_id: str,
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
    db: AsyncSurreal = Depends(get_db)
):
    result = await service.get_contact_by_id(
        db,
        contact_id,
        organization_id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return {
        "message": "Contact retrieved successfully",
        "data": result
    }


@router.post("/",status_code=status.HTTP_201_CREATED)
async def create_contact(
    contact: ContactCreate,
    current_user: dict = Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
    db: AsyncSurreal = Depends(get_db)
):
    created = await service.create_contact(
        db,
        {
            **contact.model_dump(),
            "created_by": current_user["id"],
            "organization_id": organization_id
        }
    )

    return {
        "message": "Contact created successfully",
        "data": created
    }


@router.put("/{contact_id}")
async def update_contact(
    contact_id: str,
    contact: ContactUpdate,
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
    db: AsyncSurreal = Depends(get_db)
):
    result = await service.update_contact(
        db,
        contact_id,
        contact.model_dump(),
        organization_id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return {
        "message": "Contact updated successfully",
        "data": result
    }


@router.delete(
    "/{contact_id}",
    status_code=status.HTTP_204_NO_CONTENT
)
async def delete_contact(
    contact_id: str,
    organization_id: str = Depends(get_current_organization_id),
    membership: dict = Depends(get_current_membership),
    db: AsyncSurreal = Depends(get_db)
):
    result = await service.delete_contact(
        db,
        contact_id,
        organization_id
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Contact not found"
        )

    return None
