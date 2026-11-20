
def test_register_success(client, test_data):
    payload = {
        "name": "Register Test User",
        "email": "register-success@example.com",
        "password": "TestPassword123!",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 201, response.text

    data = response.json()

    assert data["id"]
    assert data["name"] == payload["name"]
    assert data["email"] == payload["email"]
    assert data["message"] == "User registered successfully"

    test_data["users"].append(data["id"])


def test_register_duplicate_email(client, registered_user):
    payload = {
        "name": "Duplicate User",
        "email": registered_user["email"],
        "password": "TestPassword123!",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 409
    assert response.json()["detail"] == "Email already registered"


def test_register_invalid_email(client):
    payload = {
        "name": "Invalid Email User",
        "email": "not-an-email",
        "password": "TestPassword123!",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422


def test_register_short_password(client):
    payload = {
        "name": "Short Password User",
        "email": "short-password@example.com",
        "password": "123",
    }

    response = client.post("/auth/register", json=payload)

    assert response.status_code == 422


def test_register_missing_fields(client):
    response = client.post(
        "/auth/register",
        json={
            "name": "Missing Fields User",
        },
    )

    assert response.status_code == 422
