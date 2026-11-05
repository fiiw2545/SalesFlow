from fastapi import APIRouter, Depends, HTTPException, status
from surrealdb import AsyncSurreal

from app.database.dependencies import get_db
from app.security.dependencies import (
    get_current_user,
    get_current_organization_id,
    get_current_membership,
)

from app.modules.tasks.schemas import (
    TaskCreate,
    TaskUpdate,
    TaskResponse,
)

from app.modules.tasks.service import (
    list_tasks,
    retrieve_task,
    add_task,
    edit_task,
    remove_task,
)


router = APIRouter(
    prefix="/tasks",
    tags=["Tasks"],
)


@router.get("/", response_model=list[TaskResponse])
async def get_all_tasks(
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    return await list_tasks(
        db=db,
        organization_id=organization_id,
    )


@router.post("/", response_model=TaskResponse, status_code=status.HTTP_201_CREATED)
async def create_new_task(
    data: TaskCreate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await add_task(
        db=db,
        data=data.model_dump(),
        organization_id=organization_id,
        assigned_to=str(current_user["id"]),
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Deal or Contact not found in this organization",
        )

    return result


@router.get("/{task_id}", response_model=TaskResponse)
async def get_task(
    task_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await retrieve_task(
        db=db,
        task_id=task_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return result


@router.put("/{task_id}", response_model=TaskResponse)
async def update_existing_task(
    task_id: str,
    data: TaskUpdate,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await edit_task(
        db=db,
        task_id=task_id,
        data=data.model_dump(),
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task or related resource not found",
        )

    return result


@router.delete("/{task_id}")
async def delete_existing_task(
    task_id: str,
    db: AsyncSurreal = Depends(get_db),
    current_user=Depends(get_current_user),
    organization_id: str = Depends(get_current_organization_id),
    membership=Depends(get_current_membership),
):
    result = await remove_task(
        db=db,
        task_id=task_id,
        organization_id=organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Task not found",
        )

    return {
        "message": "Task deleted successfully"
    }