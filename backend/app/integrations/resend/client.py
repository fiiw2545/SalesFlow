import resend

from app.core.config import RESEND_API_KEY


def get_resend_client():
    """
    Configure and return the Resend Emails SDK.
    """
    if not RESEND_API_KEY:
        raise RuntimeError("RESEND_API_KEY is not configured")

    resend.api_key = RESEND_API_KEY

    return resend.Emails
