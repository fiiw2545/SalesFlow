from fastapi import APIRouter, Depends, HTTPException, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.notes.schemas import (
    NoteCreate,
    NoteUpdate,
    NoteResponse,
)

from app.modules.notes.service import (
    list_notes,
    retrieve_note,
    add_note,
    edit_note,
    remove_note,
)


router = APIRouter(
    prefix="/notes",
    tags=["Notes"],
)


@router.get("/", response_model=list[NoteResponse])
async def get_all_notes(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_notes(
        db=db,
        organization_id=organization_id,
    )


@router.post(
    "/",
    response_model=NoteResponse,
    status_code=status.HTTP_201_CREATED,
)
async def create_new_note(
    data: NoteCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await add_note(
        db=db,
        data=data.model_dump(),
        organization_id=organization_id,
        created_by=str(current_user["id"]),
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Company, Contact, or Deal not found in this organization",
        )

    return result


@router.get("/{note_id}", response_model=NoteResponse)
async def get_note(
    note_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await retrieve_note(
        db=db,
        note_id=note_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    return result


@router.put("/{note_id}", response_model=NoteResponse)
async def update_existing_note(
    note_id: str,
    data: NoteUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await edit_note(
        db=db,
        note_id=note_id,
        data=data.model_dump(),
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note or related resource not found",
        )

    return result


@router.delete("/{note_id}")
async def delete_existing_note(
    note_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await remove_note(
        db=db,
        note_id=note_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Note not found",
        )

    return {
        "message": "Note deleted successfully"
    }