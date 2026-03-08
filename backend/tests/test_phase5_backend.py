import pytest
from httpx import AsyncClient

from app.core.security import hash_password
from app.models.company import Company
from app.models.glossary import Glossary
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
async def test_phase5_notices_consulting_glossary(client: AsyncClient, db_session):
    db = db_session

    # Create users
    admin, _ = await create_verified_user(db, "admin@test.com", "admin", "삼일회계법인", "accountant")
    accountant, _ = await create_verified_user(db, "acc@test.com", "accountant", "삼일PwC", "accountant")
    seller, _ = await create_verified_user(db, "seller@test.com", "seller", "OO저축은행", "seller")
    buyer, _ = await create_verified_user(db, "buyer@test.com", "buyer", "OO F&I", "buyer")

    # Seed glossary
    for i, (term, definition) in enumerate([
        ("NPL", "금융기관의 부실채권"),
        ("자산확정일", "매각 대상 채권 확정 기준일"),
        ("매각대상자산", "금융기관이 매각하고자 하는 채권"),
        ("Data Disk", "채권 정보 원천 데이터"),
        ("Invitation Letter", "입찰 참여 초청 문서"),
        ("입찰참가의향서", "입찰 참여 의향 표명"),
        ("비밀유지서약서", "기밀 유지 약정서"),
        ("적격 투자자", "입찰 참여 자격 인정 기관"),
        ("Bid Package", "입찰 자료 묶음"),
        ("자산양수도계약서", "매각/인수 최종 계약서"),
        ("Interim", "거래 종결 전 과도기 기간"),
    ], 1):
        db.add(Glossary(term=term, definition=definition, sort_order=i))

    await db.commit()

    admin_token = await login(client, "admin@test.com")
    acc_token = await login(client, "acc@test.com")
    seller_token = await login(client, "seller@test.com")

    admin_h = {"Authorization": f"Bearer {admin_token}"}
    acc_h = {"Authorization": f"Bearer {acc_token}"}
    seller_h = {"Authorization": f"Bearer {seller_token}"}

    # === NOTICES ===
    # Unauthenticated → 401
    resp = await client.get("/api/v1/notices")
    assert resp.status_code == 401

    # Authenticated → 200 (empty)
    resp = await client.get("/api/v1/notices", headers=seller_h)
    assert resp.status_code == 200
    assert resp.json()["total"] == 0

    # Create by accountant → 201
    resp = await client.post(
        "/api/v1/notices",
        data={"title": "테스트 공지", "content": "공지 내용입니다.", "category": "전체"},
        headers=acc_h,
    )
    assert resp.status_code == 201
    notice_id = resp.json()["id"]

    # Create by seller → 403
    resp = await client.post(
        "/api/v1/notices",
        data={"title": "불가", "content": "내용", "category": "전체"},
        headers=seller_h,
    )
    assert resp.status_code == 403

    # Detail
    resp = await client.get(f"/api/v1/notices/{notice_id}", headers=seller_h)
    assert resp.status_code == 200
    assert resp.json()["content"] == "공지 내용입니다."

    # Patch with empty reason → 422
    resp = await client.patch(
        f"/api/v1/notices/{notice_id}",
        json={"reason": "  ", "title": "수정"},
        headers=acc_h,
    )
    assert resp.status_code == 422

    # Patch with valid reason → 200
    resp = await client.patch(
        f"/api/v1/notices/{notice_id}",
        json={"reason": "오타 수정", "title": "수정된 공지"},
        headers=acc_h,
    )
    assert resp.status_code == 200
    assert resp.json()["title"] == "수정된 공지"

    # === GLOSSARY ===
    # Public (no auth) → 200
    resp = await client.get("/api/v1/glossary")
    assert resp.status_code == 200
    assert len(resp.json()["items"]) == 11

    # === CONSULTING ===
    # Submit by seller → 201
    resp = await client.post(
        "/api/v1/consulting",
        json={"type": "selling", "title": "매각 문의", "content": "NPL 매각 관련 문의드립니다."},
        headers=seller_h,
    )
    assert resp.status_code == 201
    assert resp.json()["status"] == "pending"

    # Seller lists own only
    resp = await client.get("/api/v1/consulting", headers=seller_h)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # Admin sees all
    resp = await client.get("/api/v1/consulting", headers=admin_h)
    assert resp.status_code == 200
    assert resp.json()["total"] == 1

    # Unauthenticated → 401
    resp = await client.post(
        "/api/v1/consulting",
        json={"type": "buying", "title": "t", "content": "c"},
    )
    assert resp.status_code == 401
