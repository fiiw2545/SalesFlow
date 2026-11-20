import ipaddress
import os
from urllib.parse import urlsplit

from dotenv import load_dotenv

ENV_FILE = os.getenv("ENV_FILE", ".env")
load_dotenv(ENV_FILE)

APP_ENV = os.getenv("APP_ENV", "development").strip().lower()

if APP_ENV not in {"development", "testing", "production"}:
    raise RuntimeError(
        f"Invalid APP_ENV: {APP_ENV}"
    )

SURREALDB_URL = os.getenv("SURREALDB_URL")
SURREALDB_USERNAME = os.getenv("SURREALDB_USERNAME")
SURREALDB_PASSWORD = os.getenv("SURREALDB_PASSWORD")
SURREALDB_NAMESPACE = os.getenv("SURREALDB_NAMESPACE")
SURREALDB_DATABASE = os.getenv("SURREALDB_DATABASE")
JWT_SECRET_KEY = os.getenv("JWT_SECRET_KEY")
JWT_ALGORITHM = os.getenv("JWT_ALGORITHM")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS"))
RESEND_API_KEY = os.getenv("RESEND_API_KEY")
RESEND_FROM_EMAIL = os.getenv("RESEND_FROM_EMAIL")
# Filebase Storage
FILEBASE_ENDPOINT = os.getenv(
    "FILEBASE_ENDPOINT",
    "https://s3.filebase.io",
)
FILEBASE_REGION = os.getenv("FILEBASE_REGION", "auto")
FILEBASE_BUCKET = os.getenv("FILEBASE_BUCKET")
FILEBASE_ACCESS_KEY = os.getenv("FILEBASE_ACCESS_KEY")
FILEBASE_SECRET_KEY = os.getenv("FILEBASE_SECRET_KEY")

FILE_MAX_SIZE_MB = int(os.getenv("FILE_MAX_SIZE_MB", "10"))

# LINE Messaging API
LINE_CHANNEL_ACCESS_TOKEN = os.getenv(
    "LINE_CHANNEL_ACCESS_TOKEN"
)
LINE_CHANNEL_SECRET = os.getenv(
    "LINE_CHANNEL_SECRET"
)
LINE_TEST_USER_ID = os.getenv(
    "LINE_TEST_USER_ID"
)

FRONTEND_URL = os.getenv(
    "FRONTEND_URL",
    "http://localhost:5173",
)

# Environment safety checks
namespace = (SURREALDB_NAMESPACE or "").lower()
database = (SURREALDB_DATABASE or "").lower()

is_test_database = (
    namespace.endswith("_test")
    or database.endswith("_test")
)

if APP_ENV == "production":
    frontend_url = FRONTEND_URL.strip()

    if not frontend_url:
        raise RuntimeError(
            "Production must define FRONTEND_URL."
        )

    try:
        parsed_url = urlsplit(frontend_url)
        hostname = parsed_url.hostname

        if (
            parsed_url.scheme != "https"
            or not hostname
            or parsed_url.username
            or parsed_url.password
        ):
            raise ValueError

        hostname = hostname.lower()

        is_localhost = (
            hostname == "localhost"
            or hostname.endswith(".localhost")
        )

        try:
            is_loopback = ipaddress.ip_address(
                hostname
            ).is_loopback
        except ValueError:
            is_loopback = False

        if is_localhost or is_loopback:
            raise ValueError

        # Access port to detect invalid port values.
        _ = parsed_url.port

    except ValueError:
        raise RuntimeError(
            "Production must use a valid HTTPS FRONTEND_URL "
            "with a public hostname."
        ) from None

if APP_ENV != "testing" and is_test_database:
    raise RuntimeError(
        f"{APP_ENV} environment cannot use a test database."
    )
if APP_ENV == "testing":
    if not (
        namespace.endswith("_test")
        and database.endswith("_test")
    ):
        raise RuntimeError(
            "Testing environment must use a test namespace and database."
        )