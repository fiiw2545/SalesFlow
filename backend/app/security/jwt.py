
from datetime import datetime, timedelta, timezone

import jwt

from app.core.config import (
    JWT_SECRET_KEY,
    JWT_ALGORITHM,
    ACCESS_TOKEN_EXPIRE_MINUTES,
    REFRESH_TOKEN_EXPIRE_DAYS,
)


def create_access_token(
    user_id: str,
    sid: str,
) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "sid": sid,
        "type": "access",
        "iat": now,
        "exp": now + timedelta(
            minutes=ACCESS_TOKEN_EXPIRE_MINUTES
        ),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def create_refresh_token(
    user_id: str,
    sid: str,
    jti: str,
) -> str:
    now = datetime.now(timezone.utc)

    payload = {
        "sub": user_id,
        "sid": sid,
        "jti": jti,
        "type": "refresh",
        "iat": now,
        "exp": now + timedelta(
            days=REFRESH_TOKEN_EXPIRE_DAYS
        ),
    }

    return jwt.encode(
        payload,
        JWT_SECRET_KEY,
        algorithm=JWT_ALGORITHM,
    )


def decode_token(
    token: str,
    expected_type: str,
) -> dict:
    payload = jwt.decode(
        token,
        JWT_SECRET_KEY,
        algorithms=[JWT_ALGORITHM],
    )

    if payload.get("type") != expected_type:
        raise ValueError("Invalid token type")

    return payload
