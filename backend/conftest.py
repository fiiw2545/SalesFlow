
import os
from pathlib import Path

import pytest
from dotenv import load_dotenv
from fastapi.testclient import TestClient


# 1. Load test environment before importing the application.
BASE_DIR = Path(__file__).resolve().parent
TEST_ENV_FILE = BASE_DIR / ".env.test"

if not TEST_ENV_FILE.is_file():
    raise RuntimeError("Missing backend/.env.test")

os.environ["ENV_FILE"] = str(TEST_ENV_FILE)
load_dotenv(TEST_ENV_FILE, override=True)


# 2. Verify database configuration before importing the app.
from app.core.config import (
    SURREALDB_URL,
    SURREALDB_NAMESPACE,
    SURREALDB_DATABASE,
)

if SURREALDB_URL != "ws://localhost:8002":
    raise RuntimeError(
        f"Unexpected test database URL: {SURREALDB_URL}"
    )

if SURREALDB_NAMESPACE != "salesflow_test":
    raise RuntimeError(
        f"Refusing to run tests in namespace: {SURREALDB_NAMESPACE}"
    )

if SURREALDB_DATABASE != "crm_test":
    raise RuntimeError(
        f"Refusing to run tests in database: {SURREALDB_DATABASE}"
    )


# 3. Import the application after environment validation.
from app.main import app


# 4. Start FastAPI lifespan when a test requests the client.
@pytest.fixture(scope="session")
def client():
    with TestClient(app) as test_client:
        yield test_client
