
from app.integrations.line.client import (
    LineAPIError,
    push_message,
)


class LineDeliveryError(Exception):
    """Raised when a LINE message cannot be delivered."""


async def send_text_message(
    to: str,
    text: str,
) -> None:
    if not to or not to.strip():
        raise ValueError(
            "LINE recipient ID is required"
        )

    if not text or not text.strip():
        raise ValueError(
            "LINE message cannot be empty"
        )

    payload = {
        "to": to,
        "messages": [
            {
                "type": "text",
                "text": text,
            }
        ],
    }

    try:
        await push_message(payload)

    except LineAPIError as exc:
        raise LineDeliveryError(
            "Failed to send message through LINE"
        ) from exc
