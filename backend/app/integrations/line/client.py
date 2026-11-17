
from typing import Any

import aiohttp

from app.core.config import LINE_CHANNEL_ACCESS_TOKEN


LINE_PUSH_MESSAGE_URL = (
    "https://api.line.me/v2/bot/message/push"
)


class LineAPIError(Exception):
    """Raised when LINE API request fails."""


async def push_message(payload: dict[str, Any]) -> None:
    if not LINE_CHANNEL_ACCESS_TOKEN:
        raise LineAPIError(
            "LINE_CHANNEL_ACCESS_TOKEN is not configured"
        )

    headers = {
        "Authorization": (
            f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}"
        ),
        "Content-Type": "application/json",
    }

    timeout = aiohttp.ClientTimeout(total=15)

    try:
        async with aiohttp.ClientSession(
            timeout=timeout
        ) as session:
            async with session.post(
                LINE_PUSH_MESSAGE_URL,
                headers=headers,
                json=payload,
            ) as response:

                if response.status != 200:
                    error_body = await response.text()

                    raise LineAPIError(
                        f"LINE API returned status "
                        f"{response.status}: {error_body[:500]}"
                    )

    except aiohttp.ClientError as exc:
        raise LineAPIError(
            "Unable to connect to LINE API"
        ) from exc


LINE_REPLY_MESSAGE_URL = "https://api.line.me/v2/bot/message/reply"


async def reply_text_message(
    reply_token: str,
    text: str,
) -> None:
    if not LINE_CHANNEL_ACCESS_TOKEN:
        raise LineAPIError(
            "LINE_CHANNEL_ACCESS_TOKEN is not configured"
        )

    headers = {
        "Authorization": f"Bearer {LINE_CHANNEL_ACCESS_TOKEN}",
        "Content-Type": "application/json",
    }

    payload = {
        "replyToken": reply_token,
        "messages": [
            {
                "type": "text",
                "text": text,
            }
        ],
    }

    timeout = aiohttp.ClientTimeout(total=15)

    try:
        async with aiohttp.ClientSession(
            timeout=timeout
        ) as session:
            async with session.post(
                LINE_REPLY_MESSAGE_URL,
                headers=headers,
                json=payload,
            ) as response:
                if response.status != 200:
                    error_body = await response.text()

                    raise LineAPIError(
                        f"LINE API returned status "
                        f"{response.status}: {error_body[:500]}"
                    )

    except aiohttp.ClientError as exc:
        raise LineAPIError(
            "Unable to connect to LINE API"
        ) from exc