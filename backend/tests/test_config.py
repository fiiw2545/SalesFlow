
import os
import subprocess
import sys


def run_config(
    tmp_path,
    app_env,
    namespace="salesflow",
    database="crm",
    frontend_url="https://example.com",
):
    env = os.environ.copy()

    env.update({
        "ENV_FILE": str(tmp_path / "empty.env"),
        "APP_ENV": app_env,
        "SURREALDB_URL": "ws://localhost:8002",
        "SURREALDB_USERNAME": "root",
        "SURREALDB_PASSWORD": "root",
        "SURREALDB_NAMESPACE": namespace,
        "SURREALDB_DATABASE": database,
        "JWT_SECRET_KEY": "test-secret",
        "JWT_ALGORITHM": "HS256",
        "ACCESS_TOKEN_EXPIRE_MINUTES": "15",
        "REFRESH_TOKEN_EXPIRE_DAYS": "7",
        "FRONTEND_URL": frontend_url,
    })

    return subprocess.run(
        [
            sys.executable,
            "-c",
            "import app.core.config",
        ],
        capture_output=True,
        text=True,
        env=env,
    )


def test_staging_accepts_valid_configuration(tmp_path):
    result = run_config(
        tmp_path,
        app_env="staging",
        namespace="salesflow_staging",
        database="crm_staging",
        frontend_url="https://staging.example.com",
    )

    assert result.returncode == 0


def test_staging_rejects_http_frontend_url(tmp_path):
    result = run_config(
        tmp_path,
        app_env="staging",
        frontend_url="http://staging.example.com",
    )

    assert result.returncode != 0
    assert "valid HTTPS FRONTEND_URL" in result.stderr


def test_staging_rejects_test_database(tmp_path):
    result = run_config(
        tmp_path,
        app_env="staging",
        namespace="salesflow_test",
        database="crm_test",
    )

    assert result.returncode != 0
    assert "cannot use a test database" in result.stderr


def test_production_still_rejects_http_frontend_url(tmp_path):
    result = run_config(
        tmp_path,
        app_env="production",
        frontend_url="http://example.com",
    )

    assert result.returncode != 0
    assert "valid HTTPS FRONTEND_URL" in result.stderr


def test_testing_requires_test_database(tmp_path):
    result = run_config(
        tmp_path,
        app_env="testing",
        namespace="salesflow_test",
        database="crm_test",
    )

    assert result.returncode == 0


def test_invalid_environment_is_rejected(tmp_path):
    result = run_config(
        tmp_path,
        app_env="invalid",
    )

    assert result.returncode != 0
    assert "Invalid APP_ENV" in result.stderr
