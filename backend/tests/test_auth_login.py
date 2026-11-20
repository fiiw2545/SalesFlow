
def test_login_success(client, registered_user):
    response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == registered_user["id"]
    assert data["email"] == registered_user["email"]
    assert data["message"] == "Login successful"

    assert "access_token" in response.cookies
    assert "refresh_token" in response.cookies

    assert response.cookies["access_token"]
    assert response.cookies["refresh_token"]


def test_login_wrong_password(client, registered_user):
    response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": "WrongPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_unknown_email(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "unknown-user@example.com",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid email or password"


def test_login_invalid_email(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "invalid-email",
            "password": "TestPassword123!",
        },
    )

    assert response.status_code == 422


def test_login_short_password(client):
    response = client.post(
        "/auth/login",
        json={
            "email": "unknown-user@example.com",
            "password": "123",
        },
    )

    assert response.status_code == 422
