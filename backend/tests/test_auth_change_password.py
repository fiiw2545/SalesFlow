
def test_change_password_success(authenticated_client, registered_user):
    response = authenticated_client.patch(
        "/auth/change-password",
        json={
            "current_password": registered_user["password"],
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 200, response.text
    assert response.json()["message"] == "Password changed successfully"


def test_change_password_wrong_current_password(authenticated_client):
    response = authenticated_client.patch(
        "/auth/change-password",
        json={
            "current_password": "WrongPassword123!",
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == "Current password is incorrect"


def test_change_password_same_password(authenticated_client, registered_user):
    response = authenticated_client.patch(
        "/auth/change-password",
        json={
            "current_password": registered_user["password"],
            "new_password": registered_user["password"],
        },
    )

    assert response.status_code == 400
    assert response.json()["detail"] == (
        "New password must be different from current password"
    )


def test_change_password_short_current_password(authenticated_client):
    response = authenticated_client.patch(
        "/auth/change-password",
        json={
            "current_password": "short",
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 422


def test_change_password_short_new_password(authenticated_client, registered_user):
    response = authenticated_client.patch(
        "/auth/change-password",
        json={
            "current_password": registered_user["password"],
            "new_password": "short",
        },
    )

    assert response.status_code == 422


def test_change_password_missing_fields(authenticated_client):
    response = authenticated_client.patch(
        "/auth/change-password",
        json={},
    )

    assert response.status_code == 422


def test_change_password_unauthenticated(client):
    client.cookies.clear()

    response = client.patch(
        "/auth/change-password",
        json={
            "current_password": "OldPassword123!",
            "new_password": "NewPassword123!",
        },
    )

    assert response.status_code == 401


def test_login_with_new_password_after_change(client, registered_user):
    # Login with the original password.
    login_response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        },
    )

    assert login_response.status_code == 200

    # Change password.
    change_response = client.patch(
        "/auth/change-password",
        json={
            "current_password": registered_user["password"],
            "new_password": "NewPassword123!",
        },
    )

    assert change_response.status_code == 200

    # Logout to clear the existing session.
    logout_response = client.post("/auth/logout")
    assert logout_response.status_code == 200

    # New password must work.
    new_login_response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": "NewPassword123!",
        },
    )

    assert new_login_response.status_code == 200

    # Old password must no longer work.
    client.post("/auth/logout")

    old_login_response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        },
    )

    assert old_login_response.status_code == 401
