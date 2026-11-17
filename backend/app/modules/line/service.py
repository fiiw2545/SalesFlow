import hashlib
import logging
import secrets

from datetime import datetime, timedelta, timezone

from fastapi import HTTPException
from surrealdb import AsyncSurreal

from app.modules.line import repository


CODE_ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"
CODE_LENGTH = 10
CODE_EXPIRE_SECONDS = 300

def normalize_code(code: str) -> str:
    normalized = code.strip().upper().replace(" ", "")

    if normalized.startswith("SF-"):
        normalized = normalized[3:]

    return normalized.replace("-", "")


def hash_code(code: str) -> str:
    return hashlib.sha256(
        normalize_code(code).encode("utf-8")
    ).hexdigest()


def generate_code() -> str:
    value = "".join(
        secrets.choice(CODE_ALPHABET)
        for _ in range(CODE_LENGTH)
    )

    return f"SF-{value[:5]}-{value[5:]}"


async def create_link_code(
    db: AsyncSurreal,
    user_id: str,
):
    current_line_id = await repository.get_user_line_id(
        db,
        user_id,
    )

    if current_line_id:
        raise HTTPException(
            status_code=409,
            detail="LINE account is already connected",
        )

    code = generate_code()

    expires_at = (
        datetime.now(timezone.utc)
        + timedelta(seconds=CODE_EXPIRE_SECONDS)
    )

    result = await repository.create_link_code(
        db=db,
        user_id=user_id,
        code_hash=hash_code(code),
        expires_at=expires_at,
    )

    if not result:
        raise HTTPException(
            status_code=500,
            detail="Unable to create LINE linking code",
        )

    return {
        "code": code,
        "expires_in": CODE_EXPIRE_SECONDS,
        "message": "Send this code to SalesFlow CRM LINE Official Account",
    }


async def get_line_status(
    db: AsyncSurreal,
    user_id: str,
):
    line_user_id = await repository.get_user_line_id(
        db,
        user_id,
    )

    return {
        "connected": bool(line_user_id),
    }


async def disconnect_line(
    db: AsyncSurreal,
    user_id: str,
):
    result = await repository.disconnect_user_line(
        db,
        user_id,
    )

    if not result:
        raise HTTPException(
            status_code=404,
            detail="User not found",
        )

    return {
        "message": "LINE account disconnected successfully",
    }



async def link_line_account(
    db: AsyncSurreal,
    code: str,
    line_user_id: str,
):
    if not code or not line_user_id:
        logging.warning("LINE linking failed: missing code or line_user_id")
        return False

    if len(normalize_code(code)) != CODE_LENGTH:
        logging.warning("LINE linking failed: invalid code length")
        return False

    claimed = await repository.claim_link_code(
        db,
        hash_code(code),
    )

    if not claimed:
        logging.warning(
            "LINE linking failed: code could not be claimed"
        )
        return False

    logging.info("LINE linking: code claimed successfully")

    user_id = claimed.get("user_id")

    if not user_id:
        logging.warning(
            "LINE linking failed: claimed code has no user_id"
        )
        return False

    try:
        linked_user = await repository.set_user_line_id(
            db=db,
            user_id=user_id,
            line_user_id=line_user_id,
        )

        if not linked_user:
            logging.warning(
                "LINE linking failed: user update returned no record"
            )
            return False

        logging.info("LINE linking completed successfully")
        return True

    except Exception:
        logging.exception(
            "Failed to link LINE account"
        )
        return False
