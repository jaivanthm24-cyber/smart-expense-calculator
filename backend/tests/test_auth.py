def test_register_success(client):
    response = client.post(
        "/api/auth/register",
        json={
            "email": "newuser@example.com",
            "password": "SecurePassword123!",
            "full_name": "New User",
            "currency": "USD",
        },
    )
    assert response.status_code == 201
    data = response.json()
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["user"]["email"] == "newuser@example.com"
    assert data["user"]["full_name"] == "New User"


def test_register_duplicate_email(client, test_user):
    response = client.post(
        "/api/auth/register",
        json={
            "email": test_user.email,
            "password": "AnotherPassword123!",
            "full_name": "Duplicate User",
            "currency": "USD",
        },
    )
    assert response.status_code == 400
    assert "already exists" in response.json()["detail"].lower()


def test_login_invalid_password(client, test_user):
    response = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "WrongPassword!"},
    )
    assert response.status_code == 401


def test_refresh_token_flow(client, test_user):
    # Login first
    login_res = client.post(
        "/api/auth/login",
        json={"email": test_user.email, "password": "Password123!"},
    )
    assert login_res.status_code == 200
    refresh_token = login_res.json()["refresh_token"]

    # Use refresh token to obtain a fresh access token
    refresh_res = client.post(
        "/api/auth/refresh",
        json={"refresh_token": refresh_token},
    )
    assert refresh_res.status_code == 200
    assert "access_token" in refresh_res.json()


def test_profile_and_update(client, auth_headers):
    # Get profile
    res = client.get("/api/auth/me", headers=auth_headers)
    assert res.status_code == 200
    assert res.json()["email"] == "testuser@example.com"

    # Update profile
    update_res = client.put(
        "/api/auth/me",
        headers=auth_headers,
        json={"full_name": "Updated Name", "currency": "EUR"},
    )
    assert update_res.status_code == 200
    assert update_res.json()["full_name"] == "Updated Name"
    assert update_res.json()["currency"] == "EUR"


def test_forgot_and_reset_password(client):
    # Register a user specifically for password reset testing
    client.post(
        "/api/auth/register",
        json={
            "email": "resetuser@example.com",
            "password": "InitialPassword123!",
            "full_name": "Reset Test User",
            "currency": "USD",
        },
    )

    # Request reset
    req_res = client.post(
        "/api/auth/forgot-password",
        json={"email": "resetuser@example.com"},
    )
    assert req_res.status_code == 200
    raw_token = req_res.json().get("reset_token")
    assert raw_token is not None

    # Reset with token
    reset_res = client.post(
        "/api/auth/reset-password",
        json={"token": raw_token, "new_password": "BrandNewPassword123!"},
    )
    assert reset_res.status_code == 200

    # Login with new password
    new_login = client.post(
        "/api/auth/login",
        json={"email": "resetuser@example.com", "password": "BrandNewPassword123!"},
    )
    assert new_login.status_code == 200
