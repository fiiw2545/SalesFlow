
def test_app_starts(client):
    response = client.get("/docs")

    assert response.status_code == 200


def test_database_connection(client):
    response = client.get("/db-version")

    assert response.status_code == 200

    data = response.json()

    assert data["message"] == "Database connection successful"
    assert data["version"]
    assert "database_info" in data
