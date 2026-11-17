
import re
import uuid

from datetime import datetime, timezone
from pathlib import Path

from fastapi import HTTPException, UploadFile
from starlette.concurrency import run_in_threadpool
from surrealdb import AsyncSurreal

from app.core.config import FILE_MAX_SIZE_MB

from app.modules.files import repository, storage


ALLOWED_FILES = {
    ".jpg": ("image/jpeg", "IMAGE"),
    ".jpeg": ("image/jpeg", "IMAGE"),
    ".png": ("image/png", "IMAGE"),
    ".gif": ("image/gif", "IMAGE"),
    ".webp": ("image/webp", "IMAGE"),
    ".pdf": ("application/pdf", "DOCUMENT"),
    ".txt": ("text/plain", "DOCUMENT"),
    ".csv": ("text/csv", "DOCUMENT"),
    ".docx": (
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "DOCUMENT",
    ),
    ".xlsx": (
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "DOCUMENT",
    ),
}

MAX_FILE_SIZE = FILE_MAX_SIZE_MB * 1024 * 1024


def validate_file(
    filename: str,
    content_type: str,
    content: bytes,
):
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_FILES:
        raise HTTPException(
            status_code=415,
            detail="File type is not supported",
        )

    expected_type, category = ALLOWED_FILES[extension]

    if content_type != expected_type:
        raise HTTPException(
            status_code=415,
            detail="File content type does not match extension",
        )

    if not content:
        raise HTTPException(
            status_code=400,
            detail="File is empty",
        )

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(
            status_code=413,
            detail=f"Maximum file size is {FILE_MAX_SIZE_MB} MB",
        )

    signatures = {
        ".jpg": lambda b: b.startswith(b"\xff\xd8\xff"),
        ".jpeg": lambda b: b.startswith(b"\xff\xd8\xff"),
        ".png": lambda b: b.startswith(b"\x89PNG\r\n\x1a\n"),
        ".gif": lambda b: b.startswith((b"GIF87a", b"GIF89a")),
        ".webp": lambda b: (
            len(b) >= 12
            and b[:4] == b"RIFF"
            and b[8:12] == b"WEBP"
        ),
        ".pdf": lambda b: b.startswith(b"%PDF-"),
        ".docx": lambda b: b.startswith(b"PK"),
        ".xlsx": lambda b: b.startswith(b"PK"),
    }

    checker = signatures.get(extension)

    if checker and not checker(content):
        raise HTTPException(
            status_code=415,
            detail="Invalid file content",
        )

    return extension, category


def clean_filename(filename: str):
    filename = Path(filename).name
    filename = re.sub(r"[\x00-\x1f\x7f]", "", filename)

    if not filename.strip():
        raise HTTPException(
            status_code=400,
            detail="Invalid filename",
        )

    return filename


def storage_error():
    raise HTTPException(
        status_code=502,
        detail="File storage service is unavailable",
    )


async def upload_file(
    db: AsyncSurreal,
    file: UploadFile,
    organization_id: str,
    user_id: str,
):
    original_name = clean_filename(file.filename or "")

    content = await file.read(MAX_FILE_SIZE + 1)

    extension, category = validate_file(
        original_name,
        file.content_type or "",
        content,
    )

    organization_key = re.sub(
        r"[^a-zA-Z0-9_-]",
        "_",
        organization_id,
    )

    storage_key = (
        f"organizations/{organization_key}/"
        f"{uuid.uuid4().hex}{extension}"
    )

    try:
        await run_in_threadpool(
            storage.upload_object,
            storage_key,
            content,
            file.content_type,
        )
    except storage.StorageError:
        storage_error()

    now = datetime.now(timezone.utc)

    data = {
        "organization_id": repository.to_record_id(
            "organizations",
            organization_id,
        ),
        "original_name": original_name,
        "storage_key": storage_key,
        "content_type": file.content_type,
        "extension": extension,
        "size": len(content),
        "category": category,
        "uploaded_by": repository.to_record_id(
            "users",
            user_id,
        ),
        "created_at": now,
        "updated_at": now,
    }

    try:
        result = await repository.create_file(db, data)

        if not result:
            raise RuntimeError("Failed to create file metadata")

        return result

    except Exception:
        try:
            await run_in_threadpool(
                storage.delete_object,
                storage_key,
            )
        except storage.StorageError:
            pass

        raise HTTPException(
            status_code=500,
            detail="Failed to save file metadata",
        )


async def list_files(
    db: AsyncSurreal,
    organization_id: str,
    limit: int,
    offset: int,
):
    items = await repository.get_files(
        db,
        organization_id,
        limit,
        offset,
    )

    total = await repository.count_files(
        db,
        organization_id,
    )

    return {
        "items": items,
        "total": total,
        "limit": limit,
        "offset": offset,
    }


async def get_file_detail(
    db: AsyncSurreal,
    file_id: str,
    organization_id: str,
):
    result = await repository.get_file_by_id(
        db,
        file_id,
        organization_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="File not found",
        )

    return result


async def download_file(
    db: AsyncSurreal,
    file_id: str,
    organization_id: str,
):
    metadata = await get_file_detail(
        db,
        file_id,
        organization_id,
    )

    try:
        content = await run_in_threadpool(
            storage.download_object,
            metadata["storage_key"],
        )
    except storage.StorageError:
        storage_error()

    return metadata, content


async def remove_file(
    db: AsyncSurreal,
    file_id: str,
    organization_id: str,
):
    metadata = await get_file_detail(
        db,
        file_id,
        organization_id,
    )

    try:
        await run_in_threadpool(
            storage.delete_object,
            metadata["storage_key"],
        )
    except storage.StorageError:
        storage_error()

    result = await repository.delete_file(
        db,
        file_id,
    )

    if not result:
        raise HTTPException(
            status_code=500,
            detail="Failed to delete file metadata",
        )

    return {
        "message": "File deleted successfully",
        "file_id": file_id,
    }


async def upload_avatar(
    db: AsyncSurreal,
    file: UploadFile,
    user_id: str,
):
    original_name = clean_filename(file.filename or "")

    content = await file.read(MAX_FILE_SIZE + 1)

    extension, category = validate_file(
        original_name,
        file.content_type or "",
        content,
    )

    if category != "IMAGE":
        raise HTTPException(
            status_code=415,
            detail="Avatar must be an image",
        )

    user_key = re.sub(
        r"[^a-zA-Z0-9_-]",
        "_",
        user_id,
    )

    storage_key = (
        f"users/{user_key}/avatars/"
        f"{uuid.uuid4().hex}{extension}"
    )

    try:
        await run_in_threadpool(
            storage.upload_object,
            storage_key,
            content,
            file.content_type,
        )
    except storage.StorageError:
        storage_error()

    now = datetime.now(timezone.utc)

    data = {
        "organization_id": None,
        "owner_user_id": repository.to_record_id(
            "users",
            user_id,
        ),
        "original_name": original_name,
        "storage_key": storage_key,
        "content_type": file.content_type,
        "extension": extension,
        "size": len(content),
        "category": "IMAGE",
        "uploaded_by": repository.to_record_id(
            "users",
            user_id,
        ),
        "created_at": now,
        "updated_at": now,
    }

    created_file = None

    try:
        created_file = await repository.create_file(
            db,
            data,
        )

        if not created_file:
            raise RuntimeError("Failed to create avatar metadata")

        updated_user = await repository.set_user_avatar(
            db,
            user_id,
            created_file["id"],
        )

        if not updated_user:
            raise RuntimeError("Failed to update user avatar")

        return created_file

    except Exception:
        if created_file:
            try:
                await repository.delete_file(
                    db,
                    created_file["id"],
                )
            except Exception:
                pass

        try:
            await run_in_threadpool(
                storage.delete_object,
                storage_key,
            )
        except storage.StorageError:
            pass

        raise HTTPException(
            status_code=500,
            detail="Failed to save user avatar",
        )


async def download_avatar(
    db: AsyncSurreal,
    file_id: str,
    user_id: str,
):
    metadata = await repository.get_avatar_file(
        db,
        file_id,
        user_id,
    )

    if not metadata:
        raise HTTPException(
            status_code=404,
            detail="Avatar not found",
        )

    try:
        content = await run_in_threadpool(
            storage.download_object,
            metadata["storage_key"],
        )
    except storage.StorageError:
        storage_error()

    return metadata, content


async def remove_avatar(
    db: AsyncSurreal,
    user_id: str,
):
    updated_user = await repository.set_user_avatar(
        db,
        user_id,
        None,
    )

    if not updated_user:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "message": "Avatar removed successfully",
    }
