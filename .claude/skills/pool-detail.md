# Skill: Pool Detail — 열람 권한 구현 패턴

## 개요
Pool 상세정보(C2-2) 접근은 세 가지 상태(active/closed/cancelled)와
역할(admin·accountant vs seller·buyer) 조합으로 완전히 다르게 동작한다.
이 스킬은 그 분기를 오류 없이 구현하기 위한 표준 패턴이다.

---

## 판단 흐름

```
GET /pools/{pool_id}
│
├─ user.role in (admin, accountant)
│   └─ → 전체 열람 (마스킹 없음)
│
└─ user.role in (seller, buyer)
    │
    ├─ pool.status == 'active'
    │   └─ → 기본 정보 반환 + 미공개 필드 null (skills/rbac-masking.md)
    │
    ├─ pool.status == 'closed'
    │   ├─ pool_participants에 user.company_id 있음?
    │   │   YES → 전체 열람 (마스킹 없음)
    │   │   NO  → 403 "참여이력이 없는 거래입니다."
    │
    └─ pool.status == 'cancelled'
        └─ → 403 "접근할 수 없는 거래입니다."
```

---

## 서비스 구현 (services/pool_service.py)

```python
async def get_detail(self, pool_id: int, user: User) -> PoolDetailResponse:
    pool = await self.repo.get_or_404(pool_id)

    # admin / accountant: 무조건 전체 열람
    if user.role in ("admin", "accountant"):
        return await self._build_detail(pool)

    # cancelled: 완전 차단
    if pool.status == "cancelled":
        raise HTTPException(403, "접근할 수 없는 거래입니다.")

    # active: 기본 정보 + 마스킹
    if pool.status == "active":
        return await self._build_detail(pool, mask=True, user=user)

    # closed: 참여이력 검증
    if pool.status == "closed":
        participated = await self.repo.check_participation(
            pool_id, user.company_id
        )
        if not participated:
            raise HTTPException(403, "참여이력이 없는 거래입니다.")
        return await self._build_detail(pool)

    raise HTTPException(500, "알 수 없는 Pool 상태입니다.")


async def _build_detail(
    self,
    pool: Pool,
    mask: bool = False,
    user: User | None = None,
) -> PoolDetailResponse:
    # pool_companies에서 양도인/양수인 조회
    seller_companies = await self.repo.get_companies(pool.id, role="seller")
    buyer_companies  = await self.repo.get_companies(pool.id, role="buyer")

    if mask:
        # skills/rbac-masking.md 참조
        pool.collateral_large = None
        pool.collateral_small = None
        seller_companies = []
        buyer_companies  = []

    # 기타 파일 4개 (IL, Bid Package, 입찰서류, 기타)
    files = await self.repo.get_pool_files(pool.id)

    return PoolDetailResponse(
        **pool.__dict__,
        seller_companies=seller_companies,
        buyer_companies=buyer_companies,
        files=files,
    )
```

---

## 레포지토리 구현

```python
# repositories/pool_repository.py

async def check_participation(self, pool_id: int, company_id: int) -> bool:
    """pool_participants 테이블에 해당 company가 있는지 확인"""
    result = await self.db.execute(
        select(PoolParticipant).where(
            and_(
                PoolParticipant.pool_id == pool_id,
                PoolParticipant.company_id == company_id,
            )
        )
    )
    return result.scalar_one_or_none() is not None

async def get_companies(self, pool_id: int, role: str) -> list[PoolCompany]:
    result = await self.db.execute(
        select(PoolCompany)
        .join(Company, PoolCompany.company_id == Company.id)
        .where(
            and_(
                PoolCompany.pool_id == pool_id,
                PoolCompany.role == role,
            )
        )
    )
    return result.scalars().all()

async def get_pool_files(self, pool_id: int) -> dict:
    """Pool 상세의 '기타' 섹션 파일 4종 조회"""
    # 별도 컬럼 방식 또는 documents 테이블 role_type='accountant' + tag 방식
    # MVP: pool 테이블에 별도 컬럼 4개로 관리 (심플하게)
    result = await self.db.execute(
        select(Pool).where(Pool.id == pool_id)
    )
    pool = result.scalar_one()
    return {
        "invitation_letter": pool.file_il_enc,
        "bid_package":       pool.file_bp_enc,
        "bid_submission":    pool.file_bs_enc,
        "other":             pool.file_etc_enc,
    }
```

---

## Pool 목록 can_view_detail 계산

```python
# Pool 목록에서 각 행의 상세보기 링크 활성화 여부
async def _can_view_detail(
    self, pool: Pool, user: User
) -> bool:
    if user.role in ("admin", "accountant"):
        return pool.status == "closed"
    if pool.status != "closed":
        return False
    return await self.repo.check_participation(pool.id, user.company_id)
```

---

## 에러 코드 기준

| 상황 | 코드 | 메시지 |
|---|---|---|
| Pool 없음 | 404 | "Pool을 찾을 수 없습니다." |
| cancelled Pool (seller/buyer) | 403 | "접근할 수 없는 거래입니다." |
| closed Pool 참여이력 없음 | 403 | "참여이력이 없는 거래입니다." |
| pending 사용자 | 403 | "관리자 인증 대기 중입니다." |

> 403 사용 이유: 404("없음")로 반환하면 Pool 존재 여부가 노출됨.
> 참여 여부와 무관하게 Pool이 존재한다는 사실 자체는 공개 정보이므로 403이 적절.

---

## 테스트 케이스 목록

```python
# tests/test_pool_detail.py
class TestPoolDetail:
    # active Pool
    async def test_active_pool_admin_sees_all_fields(...)
    async def test_active_pool_seller_sees_masked_fields(...)
    async def test_active_pool_buyer_sees_masked_fields(...)

    # closed Pool
    async def test_closed_pool_admin_sees_all(...)
    async def test_closed_pool_seller_with_participation_sees_all(...)
    async def test_closed_pool_seller_without_participation_returns_403(...)
    async def test_closed_pool_buyer_with_participation_sees_all(...)
    async def test_closed_pool_buyer_without_participation_returns_403(...)

    # cancelled Pool
    async def test_cancelled_pool_seller_returns_403(...)
    async def test_cancelled_pool_buyer_returns_403(...)
    async def test_cancelled_pool_admin_sees_all(...)

    # 인증
    async def test_unauthenticated_returns_401(...)
    async def test_pending_user_returns_403(...)
```
