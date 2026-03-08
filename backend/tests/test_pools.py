import pytest
from httpx import AsyncClient

from app.core.security import hash_password
from app.models.company import Company
from app.models.pool import Pool
from app.models.pool_participant import PoolParticipant
from app.models.user import User


async def create_verified_user(db, email, role, company_name, company_type):
    """Helper to create a verified user."""
    company = Company(name=company_name, type=company_type)
    db.add(company)
    await db.flush()
    user = User(
        email=email,
        hashed_password=hash_password("test1234"),
        name="Test User",
        company_id=company.id,
        role=role,
        is_verified=True,
    )
    db.add(user)
    await db.flush()
    return user, company


async def login(client, email):
    """Helper to get access token."""
    resp = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "test1234"},
    )
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_pool_crud_and_access_control(client: AsyncClient, db_session):
    """Comprehensive pool CRUD and access control test."""
    db = db_session

    # Create users
    admin, admin_co = await create_verified_user(
        db, "admin@test.com", "admin", "삼일회계법인", "accountant"
    )
    seller, seller_co = await create_verified_user(
        db, "seller@test.com", "seller", "OO저축은행", "seller"
    )
    buyer, buyer_co = await create_verified_user(
        db, "buyer@test.com", "buyer", "OO F&I", "buyer"
    )
    await db.commit()

    # Login all users
    admin_token = await login(client, "admin@test.com")
    seller_token = await login(client, "seller@test.com")
    buyer_token = await login(client, "buyer@test.com")

    admin_headers = {"Authorization": f"Bearer {admin_token}"}
    seller_headers = {"Authorization": f"Bearer {seller_token}"}
    buyer_headers = {"Authorization": f"Bearer {buyer_token}"}

    # === CREATE ===
    # seller cannot create pool
    resp = await client.post(
        "/api/v1/pools", json={"name": "Test Pool"}, headers=seller_headers
    )
    assert resp.status_code == 403

    # admin creates pool
    pool_data = {
        "name": "PwC-SB 2026-1 Program",
        "collateral_large": "담보",
        "collateral_small": "Regular",
        "cutoff_date": "2026-01-15",
        "bid_date": "2026-02-28",
        "opb": 125000000000,
    }
    resp = await client.post("/api/v1/pools", json=pool_data, headers=admin_headers)
    assert resp.status_code == 201
    pool_id = resp.json()["id"]

    # Create a closed pool
    resp2 = await client.post(
        "/api/v1/pools",
        json={
            "name": "Closed Pool",
            "status": "closed",
            "collateral_large": "무담보",
        },
        headers=admin_headers,
    )
    assert resp2.status_code == 201
    closed_pool_id = resp2.json()["id"]

    # Create a cancelled pool
    resp3 = await client.post(
        "/api/v1/pools",
        json={"name": "Cancelled Pool", "status": "cancelled"},
        headers=admin_headers,
    )
    assert resp3.status_code == 201
    cancelled_pool_id = resp3.json()["id"]

    # Add participation for seller to closed pool
    participant = PoolParticipant(pool_id=closed_pool_id, company_id=seller_co.id)
    db.add(participant)
    await db.commit()

    # === LIST ===
    # Admin sees all fields
    resp = await client.get("/api/v1/pools", headers=admin_headers)
    assert resp.status_code == 200
    data = resp.json()
    assert data["total"] == 3
    active_item = next(i for i in data["items"] if i["id"] == pool_id)
    assert active_item["collateral_large"] == "담보"

    # Seller sees masked fields for pools without participation
    resp = await client.get("/api/v1/pools", headers=seller_headers)
    assert resp.status_code == 200
    items = resp.json()["items"]
    active_item = next(i for i in items if i["id"] == pool_id)
    assert active_item["collateral_large"] is None  # masked

    # Seller sees unmasked fields for participated pool
    closed_item = next(i for i in items if i["id"] == closed_pool_id)
    assert closed_item["collateral_large"] == "무담보"  # unmasked

    # === DETAIL ===
    # Admin sees active pool fully
    resp = await client.get(f"/api/v1/pools/{pool_id}", headers=admin_headers)
    assert resp.status_code == 200
    assert resp.json()["collateral_large"] == "담보"

    # Seller sees active pool with masking
    resp = await client.get(f"/api/v1/pools/{pool_id}", headers=seller_headers)
    assert resp.status_code == 200
    assert resp.json()["collateral_large"] is None

    # Seller accesses closed pool with participation -> OK
    resp = await client.get(
        f"/api/v1/pools/{closed_pool_id}", headers=seller_headers
    )
    assert resp.status_code == 200

    # Buyer accesses closed pool without participation -> 403
    resp = await client.get(
        f"/api/v1/pools/{closed_pool_id}", headers=buyer_headers
    )
    assert resp.status_code == 403

    # Seller accesses cancelled pool -> 403
    resp = await client.get(
        f"/api/v1/pools/{cancelled_pool_id}", headers=seller_headers
    )
    assert resp.status_code == 403

    # Admin accesses cancelled pool -> OK
    resp = await client.get(
        f"/api/v1/pools/{cancelled_pool_id}", headers=admin_headers
    )
    assert resp.status_code == 200

    # === UPDATE ===
    # Admin updates with reason
    resp = await client.patch(
        f"/api/v1/pools/{pool_id}",
        json={"reason": "입찰기일 변경", "bid_date": "2026-03-05"},
        headers=admin_headers,
    )
    assert resp.status_code == 200
    assert resp.json()["bid_date"] == "2026-03-05"

    # Empty reason -> 422
    resp = await client.patch(
        f"/api/v1/pools/{pool_id}",
        json={"reason": "  ", "bid_date": "2026-03-10"},
        headers=admin_headers,
    )
    assert resp.status_code == 422

    # Seller cannot update -> 403
    resp = await client.patch(
        f"/api/v1/pools/{pool_id}",
        json={"reason": "test", "bid_date": "2026-03-10"},
        headers=seller_headers,
    )
    assert resp.status_code == 403

    # === UNAUTHENTICATED ===
    resp = await client.get("/api/v1/pools")
    assert resp.status_code == 401

    # 404 for non-existent pool
    resp = await client.get("/api/v1/pools/99999", headers=admin_headers)
    assert resp.status_code == 404
