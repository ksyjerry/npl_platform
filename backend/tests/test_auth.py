import pytest
from httpx import AsyncClient

REGISTER_DATA = {
    "member_type": "seller",
    "name": "홍길동",
    "company_name": "OO저축은행",
    "department": "여신관리부",
    "title": "과장",
    "phone_office": "02-1234-5678",
    "phone_mobile": "010-1234-5678",
    "email": "hong@company.com",
    "password": "test1234",
    "password_confirm": "test1234",
    "interests": ["담보"],
    "terms_1": True,
    "terms_2": True,
    "terms_3": True,
}


@pytest.mark.asyncio
async def test_register_login_validation(client: AsyncClient):
    """Register, login, and validation errors."""
    # Register success
    resp = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
    assert resp.status_code == 201
    # Auto-approve: role = member_type, is_verified = True
    assert resp.json()["role"] == "seller"
    assert resp.json()["is_verified"] is True

    # Duplicate email → 409
    resp2 = await client.post("/api/v1/auth/register", json=REGISTER_DATA)
    assert resp2.status_code == 409

    # Password mismatch → 422
    resp3 = await client.post("/api/v1/auth/register", json={**REGISTER_DATA, "email": "b@b.com", "password_confirm": "wrong"})
    assert resp3.status_code == 422

    # Short password → 422
    resp4 = await client.post("/api/v1/auth/register", json={**REGISTER_DATA, "email": "c@c.com", "password": "12345", "password_confirm": "12345"})
    assert resp4.status_code == 422

    # Login success
    login_resp = await client.post("/api/v1/auth/login", json={"email": "hong@company.com", "password": "test1234"})
    assert login_resp.status_code == 200
    token = login_resp.json()["access_token"]
    assert login_resp.json()["token_type"] == "bearer"

    # Wrong password → 401
    assert (await client.post("/api/v1/auth/login", json={"email": "hong@company.com", "password": "wrong"})).status_code == 401

    # Nonexistent email → 401
    assert (await client.post("/api/v1/auth/login", json={"email": "nobody@test.com", "password": "test1234"})).status_code == 401

    # Refresh with cookie
    refresh_cookie = login_resp.cookies.get("refresh_token")
    assert refresh_cookie is not None
    client.cookies.set("refresh_token", refresh_cookie, domain="test")
    refresh_resp = await client.post("/api/v1/auth/refresh")
    assert refresh_resp.status_code == 200
    assert "access_token" in refresh_resp.json()

    # Refresh without cookie → 401
    client.cookies.clear()
    assert (await client.post("/api/v1/auth/refresh")).status_code == 401

    # Logout
    logout_resp = await client.post("/api/v1/auth/logout", headers={"Authorization": f"Bearer {token}"})
    assert logout_resp.status_code == 200

    # Protected without token → 401
    assert (await client.post("/api/v1/auth/logout")).status_code == 401
