
def test_logout_success(authenticated_client):
    response = authenticated_client.post("/auth/logout")

    assert response.status_code == 200
    assert response.json()["message"] == "Logout successful"

    # Cookies should be cleared after logout.
    assert not authenticated_client.cookies.get("access_token")
    assert not authenticated_client.cookies.get("refresh_token")


def test_logout_revokes_session(authenticated_client):
    # Verify authentication works before logout.
    before_logout = authenticated_client.get("/auth/me")
    assert before_logout.status_code == 200

    response = authenticated_client.post("/auth/logout")
    assert response.status_code == 200

    # The revoked access token must no longer authenticate.
    after_logout = authenticated_client.get("/auth/me")
    assert after_logout.status_code == 401


def test_logout_without_authentication(client):
    response = client.post("/auth/logout")

    assert response.status_code == 200
    assert response.json()["message"] == "Logout successful"
