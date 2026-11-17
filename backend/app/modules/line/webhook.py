import base64
import hashlib
import hmac
import json
import logging
import re

from fastapi import APIRouter, Depends, Header, HTTPException, Request
from surrealdb import AsyncSurreal

from app.core.config import LINE_CHANNEL_SECRET
from app.database.dependencies import get_db

from app.integrations.line.client import (
    LineAPIError,
    reply_text_message,
)

from app.modules.line.service import link_line_account


router = APIRouter(
    prefix="/line",
    tags=["LINE Webhook"],
)


LINK_CODE_PATTERN = re.compile(
    r"^SF-[A-HJ-NP-Z2-9]{5}-[A-HJ-NP-Z2-9]{5}$",
    re.IGNORECASE,
)


def verify_line_signature(
    body: bytes,
    signature: str | None,
) -> bool:
    if not LINE_CHANNEL_SECRET or not signature:
        return False

    digest = hmac.new(
        LINE_CHANNEL_SECRET.encode("utf-8"),
        body,
        hashlib.sha256,
    ).digest()

    expected_signature = base64.b64encode(
        digest
    ).decode("utf-8")

    return hmac.compare_digest(
        expected_signature,
        signature,
    )


@router.post("/webhook")
async def line_webhook(
    request: Request,
    x_line_signature: str | None = Header(
        default=None,
        alias="X-Line-Signature",
    ),
    db: AsyncSurreal = Depends(get_db),
):
    body = await request.body()

    if not verify_line_signature(
        body,
        x_line_signature,
    ):
        raise HTTPException(
            status_code=401,
            detail="Invalid LINE signature",
        )

    try:
        payload = json.loads(body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(
            status_code=400,
            detail="Invalid webhook payload",
        )

    events = payload.get("events", [])

    for event in events:
        if event.get("type") != "message":
            continue

        source = event.get("source", {})

        # Only support private one-to-one LINE accounts.
        if source.get("type") != "user":
            continue

        line_user_id = source.get("userId")
        message = event.get("message", {})

        if message.get("type") != "text":
            continue

        text = message.get("text", "").strip()

        logging.info(
            "LINE linking message received: %r (normalized length=%s)",
            text,
            len(text.replace("-", "").replace(" ", "").upper()) - 2
        )

        if not LINK_CODE_PATTERN.fullmatch(text):
            continue

        reply_token = event.get("replyToken")

        linked = await link_line_account(
            db=db,
            code=text,
            line_user_id=line_user_id,
        )

        if linked:
            reply_text = (
                "เชื่อมบัญชี LINE กับ SalesFlow CRM สำเร็จแล้ว 🎉"
            )
        else:
            reply_text = (
                "ไม่สามารถเชื่อมบัญชีได้ "
                "รหัสอาจหมดอายุ ถูกใช้งานแล้ว "
                "หรือบัญชี LINE นี้ถูกเชื่อมกับผู้ใช้อื่นแล้ว "
                "กรุณาสร้าง Linking Code ใหม่ใน SalesFlow CRM"
            )

        if reply_token:
            try:
                await reply_text_message(
                    reply_token=reply_token,
                    text=reply_text,
                )
            except LineAPIError:
                logging.exception(
                    "Failed to reply to LINE webhook event"
                )

    return {
        "message": "Webhook processed",
    }