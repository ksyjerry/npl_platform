import pytest
from httpx import AsyncClient

from app.core.security import hash_password
from app.models.company import Company
from app.models.pool import Pool
from app.models.user import User


async def create_verified_user(db, email, role, company_name, company_type):
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
    resp = await client.post("/api/v1/auth/login", json={"email": email, "password": "test1234"})
    return resp.json()["access_token"]


@pytest.mark.asyncio
async def test_document_upload_download_access(client: AsyncClient, db_session):
    db = db_session

    admin, _ = await create_verified_user(db, "admin@test.com", "admin", "삼일회계법인", "accountant")
    seller, _ = await create_verified_user(db, "seller@test.com", "seller", "OO저축은행", "seller")
    buyer, _ = await create_verified_user(db, "buyer@test.com", "buyer", "OO F&I", "buyer")

    # Create pool
    pool = Pool(name="Test Pool", status="active", created_by=admin.id)
    db.add(pool)
    await db.commit()

    admin_token = await login(client, "admin@test.com")
    seller_token = await login(client, "seller@test.com")
    buyer_token = await login(client, "buyer@test.com")

    admin_h = {"Authorization": f"Bearer {admin_token}"}
    seller_h = {"Authorization": f"Bearer {seller_token}"}
    buyer_h = {"Authorization": f"Bearer {buyer_token}"}

    # === UPLOAD ===
    # Seller uploads to seller role_type → 201
    resp = await client.post(
        "/api/v1/documents/upload",
        data={"pool_id": str(pool.id), "role_type": "seller", "memo": "테스트 메모"},
        files={"file": ("test.xlsx", b"fake xlsx content", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet")},
        headers=seller_h,
    )
    assert resp.status_code == 201
    doc_id = resp.json()["id"]
    assert resp.json()["file_name"] == "test.xlsx"

    # Buyer tries to upload seller doc → 403
    resp = await client.post(
        "/api/v1/documents/upload",
        data={"pool_id": str(pool.id), "role_type": "seller"},
        files={"file": ("test.pdf", b"fake pdf", "application/pdf")},
        headers=buyer_h,
    )
    assert resp.status_code == 403

    # Invalid extension → 400
    resp = await client.post(
        "/api/v1/documents/upload",
        data={"pool_id": str(pool.id), "role_type": "seller"},
        files={"file": ("test.exe", b"bad file", "application/octet-stream")},
        headers=seller_h,
    )
    assert resp.status_code == 400

    # Buyer uploads to buyer role_type → 201
    resp = await client.post(
        "/api/v1/documents/upload",
        data={"pool_id": str(pool.id), "role_type": "buyer"},
        files={"file": ("buyer_data.csv", b"col1,col2\na,b", "text/csv")},
        headers=buyer_h,
    )
    assert resp.status_code == 201
    buyer_doc_id = resp.json()["id"]

    # === LIST ===
    # Seller lists seller docs → sees own
    resp = await client.get("/api/v1/documents?role_type=seller", headers=seller_h)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # Buyer lists seller docs → 403
    resp = await client.get("/api/v1/documents?role_type=seller", headers=buyer_h)
    assert resp.status_code == 403

    # Admin lists seller docs → sees all
    resp = await client.get("/api/v1/documents?role_type=seller", headers=admin_h)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # Admin lists buyer docs → sees all
    resp = await client.get("/api/v1/documents?role_type=buyer", headers=admin_h)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # === DOWNLOAD ===
    # Seller downloads own doc → 200
    resp = await client.get(f"/api/v1/documents/{doc_id}/download", headers=seller_h)
    assert resp.status_code == 200

    # Buyer downloads seller doc → 403
    resp = await client.get(f"/api/v1/documents/{doc_id}/download", headers=buyer_h)
    assert resp.status_code == 403

    # Admin downloads any → 200
    resp = await client.get(f"/api/v1/documents/{doc_id}/download", headers=admin_h)
    assert resp.status_code == 200

    # === UPDATE ===
    # Seller updates memo with reason → 200
    resp = await client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"reason": "메모 수정", "memo": "수정된 메모"},
        headers=seller_h,
    )
    assert resp.status_code == 200
    assert resp.json()["memo"] == "수정된 메모"

    # Empty reason → 422
    resp = await client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"reason": "  ", "memo": "test"},
        headers=seller_h,
    )
    assert resp.status_code == 422

    # Buyer can't update seller's doc → 403
    resp = await client.patch(
        f"/api/v1/documents/{doc_id}",
        json={"reason": "test", "memo": "hacked"},
        headers=buyer_h,
    )
    assert resp.status_code == 403

    # === UNAUTHENTICATED ===
    resp = await client.get("/api/v1/documents?role_type=seller")
    assert resp.status_code == 401
