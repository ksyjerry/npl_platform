# Skill: RBAC Masking — 역할별 필드 마스킹 패턴

## 개요
Pool 목록(C2-1)에서 seller/buyer에게 미공개 필드 4개를 null로 반환한다.
"참여이력 인센티브" 설계: 실제로 거래에 참여했던 업체만 해당 정보를 열람할 수 있다.

---

## 마스킹 대상 필드 (4개)

| 필드 | 출처 | 마스킹 조건 |
|---|---|---|
| collateral_large | pools.collateral_large | 참여이력 없는 업체 |
| collateral_small | pools.collateral_small | 참여이력 없는 업체 |
| seller_name | pool_companies (role='seller') | 참여이력 없는 업체 |
| buyer_name | pool_companies (role='buyer') | 참여이력 없는 업체 |

나머지 공개 필드: name, status, cutoff_date, bid_date, closing_date, opb, sale_price, sale_ratio, remarks, can_view_detail

---

## 서비스 구현

```python
# services/pool_service.py

# 마스킹이 필요한 역할
MASKED_ROLES = {"seller", "buyer"}

async def get_list(
    self,
    user: User,
    status: str | None = None,
    page: int = 1,
    size: int = 20,
) -> PoolListResponse:
    pools = await self.repo.get_all(status=status, page=page, size=size)

    if user.role in ("admin", "accountant"):
        # 전체 필드 공개 + can_view_detail 계산
        items = [
            await self._to_response(p, user, mask=False) for p in pools
        ]
    else:
        # seller / buyer: 참여이력별 마스킹
        items = [
            await self._to_response(p, user, mask=True) for p in pools
        ]

    return PoolListResponse(items=items, total=len(items))


async def _to_response(
    self,
    pool: Pool,
    user: User,
    mask: bool,
) -> PoolListItem:
    participated = False
    if mask:
        participated = await self.repo.check_participation(
            pool.id, user.company_id
        )

    # 참여이력 있으면 마스킹 해제
    show_sensitive = (not mask) or participated

    return PoolListItem(
        id=pool.id,
        name=pool.name,
        status=pool.status,
        collateral_large=pool.collateral_large if show_sensitive else None,
        collateral_small=pool.collateral_small if show_sensitive else None,
        cutoff_date=pool.cutoff_date,
        bid_date=pool.bid_date,
        closing_date=pool.closing_date,
        seller_name=await self._get_seller_name(pool.id) if show_sensitive else None,
        buyer_name=await self._get_buyer_name(pool.id) if show_sensitive else None,
        opb=pool.opb,
        sale_price=pool.sale_price,
        sale_ratio=float(pool.sale_ratio) if pool.sale_ratio else None,
        remarks=pool.remarks,
        can_view_detail=await self._can_view_detail(pool, user),
    )
```

---

## 성능 최적화 (N+1 방지)

Pool 목록이 많을 때 매 행마다 DB를 조회하면 N+1 문제가 발생한다.

```python
async def get_list_optimized(
    self, user: User, **kwargs
) -> PoolListResponse:
    pools = await self.repo.get_all(**kwargs)
    if not pools:
        return PoolListResponse(items=[], total=0)

    # seller/buyer: 한 번에 참여이력 조회
    if user.role in MASKED_ROLES:
        pool_ids = [p.id for p in pools]
        participated_pool_ids: set[int] = await self.repo.get_participated_pool_ids(
            user.company_id, pool_ids
        )
    else:
        participated_pool_ids = set(p.id for p in pools)  # admin/accountant = 모두 공개

    # pool_companies 한 번에 조회
    companies_by_pool = await self.repo.get_companies_by_pool_ids(pool_ids)

    items = []
    for pool in pools:
        show = pool.id in participated_pool_ids
        companies = companies_by_pool.get(pool.id, [])
        seller_name = next(
            (c.company_name for c in companies if c.role == "seller"), None
        ) if show else None
        buyer_name = next(
            (c.company_name for c in companies if c.role == "buyer"), None
        ) if show else None

        items.append(PoolListItem(
            id=pool.id,
            name=pool.name,
            status=pool.status,
            collateral_large=pool.collateral_large if show else None,
            collateral_small=pool.collateral_small if show else None,
            seller_name=seller_name,
            buyer_name=buyer_name,
            cutoff_date=pool.cutoff_date,
            bid_date=pool.bid_date,
            closing_date=pool.closing_date,
            opb=pool.opb,
            sale_price=pool.sale_price,
            sale_ratio=float(pool.sale_ratio) if pool.sale_ratio else None,
            remarks=pool.remarks,
            can_view_detail=pool.id in participated_pool_ids and pool.status == "closed",
        ))
    return PoolListResponse(items=items, total=len(items))
```

---

## 레포지토리 배치 쿼리

```python
async def get_participated_pool_ids(
    self, company_id: int, pool_ids: list[int]
) -> set[int]:
    """한 번의 쿼리로 company의 참여 Pool ID 집합 반환"""
    result = await self.db.execute(
        select(PoolParticipant.pool_id).where(
            and_(
                PoolParticipant.company_id == company_id,
                PoolParticipant.pool_id.in_(pool_ids),
            )
        )
    )
    return {row[0] for row in result.fetchall()}

async def get_companies_by_pool_ids(
    self, pool_ids: list[int]
) -> dict[int, list]:
    """pool_id별 회사 목록을 한 번에 조회"""
    result = await self.db.execute(
        select(PoolCompany, Company.name.label("company_name"))
        .join(Company, PoolCompany.company_id == Company.id)
        .where(PoolCompany.pool_id.in_(pool_ids))
    )
    rows = result.fetchall()
    out: dict[int, list] = {}
    for pc, cname in rows:
        out.setdefault(pc.pool_id, []).append(
            type("C", (), {"role": pc.role, "company_name": cname})()
        )
    return out
```

---

## 프론트엔드 처리

```typescript
// 미공개 필드 표시
function renderSensitiveField(value: string | null): string {
  return value ?? "—";   // null이면 "—" 표시
}

// Pool 목록 테이블 컬럼
{
  key: "collateral_large",
  header: "담보유형(대)",
  cell: (row: PoolRow) => renderSensitiveField(row.collateral_large),
}
```

---

## 테스트 케이스

```python
class TestPoolMasking:
    async def test_seller_without_participation_sees_null_sensitive_fields(...)
    async def test_seller_with_participation_sees_all_fields(...)
    async def test_buyer_without_participation_sees_null_sensitive_fields(...)
    async def test_admin_always_sees_all_fields(...)
    async def test_accountant_always_sees_all_fields(...)
    async def test_batch_query_no_n_plus_one(...)  # 쿼리 수 검증
```
