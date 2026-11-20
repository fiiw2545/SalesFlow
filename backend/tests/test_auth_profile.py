
def test_get_me_success(authenticated_client, registered_user):
    response = authenticated_client.get("/auth/me")

    assert response.status_code == 200
    data = response.json()

    assert data["id"] == registered_user["id"]
    assert data["name"] == registered_user["name"]
    assert data["email"] == registered_user["email"]
    assert "avatar_file_id" in data
    assert data["message"] == "Current user retrieved successfully"


def test_get_me_unauthenticated(client):
    client.cookies.clear()

    response = client.get("/auth/me")

    assert response.status_code == 401


def test_get_me_id_success(authenticated_client, registered_user):
    response = authenticated_client.get("/auth/me/id")

    assert response.status_code == 200

    data = response.json()

    assert data["user_id"] == registered_user["id"]
    assert data["message"] == "Current user ID retrieved successfully"


def test_get_me_id_unauthenticated(client):
    client.cookies.clear()

    response = client.get("/auth/me/id")

    assert response.status_code == 401


def test_update_profile_success(authenticated_client):
    response = authenticated_client.patch(
        "/auth/me",
        json={
            "name": "Updated Pytest User",
        },
    )

    assert response.status_code == 200

    data = response.json()

    assert data["name"] == "Updated Pytest User"
    assert data["email"]
    assert "avatar_file_id" in data
    assert data["message"] == "Profile updated successfully"

    # Verify that the updated profile is persisted.
    me_response = authenticated_client.get("/auth/me")

    assert me_response.status_code == 200
    assert me_response.json()["name"] == "Updated Pytest User"


def test_update_profile_short_name(authenticated_client):
    response = authenticated_client.patch(
        "/auth/me",
        json={
            "name": "A",
        },
    )

    assert response.status_code == 422


def test_update_profile_unauthenticated(client):
    client.cookies.clear()

    response = client.patch(
        "/auth/me",
        json={
            "name": "Updated Pytest User",
        },
    )

    assert response.status_code == 401
