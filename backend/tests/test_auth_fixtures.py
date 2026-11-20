
def test_registered_user_fixture(registered_user):
    assert registered_user["id"]
    assert registered_user["email"]
    assert registered_user["name"] == "Pytest User"


def test_authenticated_client_fixture(
    authenticated_client,
    registered_user,
):
    response = authenticated_client.get("/auth/me")

    assert response.status_code == 200

    data = response.json()

    assert data["id"] == registered_user["id"]
    assert data["email"] == registered_user["email"]
