from typing import Any

from app.core.config import RESEND_FROM_EMAIL
from app.integrations.resend.client import get_resend_client


class EmailDeliveryError(Exception):
    """Raised when an email cannot be sent."""


async def send_email(
    to: str | list[str],
    subject: str,
    html: str,
    text: str | None = None,
    reply_to: str | None = None,
) -> Any:
    """
    Send an email asynchronously using Resend.
    """

    if not RESEND_FROM_EMAIL:
        raise EmailDeliveryError(
            "RESEND_FROM_EMAIL is not configured"
        )

    recipients = [to] if isinstance(to, str) else to

    if not recipients:
        raise ValueError("At least one recipient is required")

    if not subject.strip():
        raise ValueError("Email subject cannot be empty")

    if not html.strip() and not (text and text.strip()):
        raise ValueError("Email must contain HTML or plain text")

    payload = {
        "from": RESEND_FROM_EMAIL,
        "to": recipients,
        "subject": subject,
    }

    if html.strip():
        payload["html"] = html

    if text:
        payload["text"] = text

    if reply_to:
        payload["reply_to"] = reply_to

    try:
        client = get_resend_client()
        response = await client.send_async(payload)

        return response

    except Exception as exc:
        raise EmailDeliveryError(
            "Failed to send email through Resend"
        ) from exc
