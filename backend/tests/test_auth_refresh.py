def test_refresh_success(authenticated_client):
    old_refresh_token = authenticated_client.cookies.get("refresh_token")

    response = authenticated_client.post("/auth/refresh")

    assert response.status_code == 200, response.text
    assert response.json()["message"] == "Token refreshed successfully"

    new_access_token = response.cookies.get("access_token")
    new_refresh_token = response.cookies.get("refresh_token")

    assert new_access_token
    assert new_refresh_token

    # Refresh token must rotate.
    assert new_refresh_token != old_refresh_token

    # New access token must authenticate successfully.
    me_response = authenticated_client.get("/auth/me")

    assert me_response.status_code == 200


def test_refresh_rejects_old_token_after_rotation(
    client,
    registered_user,
):
    login_response = client.post(
        "/auth/login",
        json={
            "email": registered_user["email"],
            "password": registered_user["password"],
        },
    )

    assert login_response.status_code == 200

    old_refresh_token = login_response.cookies.get("refresh_token")
    assert old_refresh_token

    # First refresh rotates the token.
    refresh_response = client.post("/auth/refresh")
    assert refresh_response.status_code == 200

    # Restore the old refresh token to simulate replay.
    client.cookies.set("refresh_token", old_refresh_token)

    replay_response = client.post("/auth/refresh")

    assert replay_response.status_code == 401
    assert replay_response.json()["detail"] == "Invalid or expired refresh token"

    # Replay detection revokes the session.
    me_response = client.get("/auth/me")
    assert me_response.status_code == 401


def test_refresh_without_cookie(client):
    client.cookies.clear()

    response = client.post("/auth/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Refresh token not found"


def test_refresh_invalid_token(client):
    client.cookies.clear()
    client.cookies.set("refresh_token", "invalid.refresh.token")

    response = client.post("/auth/refresh")

    assert response.status_code == 401
    assert response.json()["detail"] == "Invalid or expired refresh token"
