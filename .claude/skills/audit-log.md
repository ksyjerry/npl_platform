# Skill: Audit Log — Immutable 감사 로그 패턴

## 원칙
- `audit_logs` 테이블은 **INSERT ONLY** (UPDATE / DELETE 절대 금지)
- PATCH 요청 시 `reason` 필드 필수 → 빈 문자열이면 422로 차단
- old_data / new_data는 JSONB로 전체 레코드 저장
- IP 주소 항상 기록

## Pydantic: reason 필수 강제

```python
# schemas/base.py — 수정 가능한 모든 스키마가 상속
from pydantic import BaseModel, field_validator
from typing import Optional

class AuditableUpdateSchema(BaseModel):
    reason: str   # 반드시 첫 번째 필드

    @field_validator("reason")
    def reason_not_empty(cls, v: str) -> str:
        if not v or not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()

# 사용 예시
class PoolUpdateSchema(AuditableUpdateSchema):
    name: Optional[str] = None
    status: Optional[str] = None
    bid_date: Optional[date] = None
    # ... 기타 Optional 필드
```

## Repository

```python
# repositories/audit_log_repository.py
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.audit_log import AuditLog

class AuditLogRepository:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def create(
        self,
        table_name: str,
        record_id: int,
        action: str,            # "CREATE" | "UPDATE" | "DELETE"
        performed_by: int,
        ip_address: str,
        reason: str | None = None,
        old_data: dict | None = None,
        new_data: dict | None = None,
    ) -> None:
        log = AuditLog(
            table_name=table_name,
            record_id=record_id,
            action=action,
            reason=reason,
            old_data=old_data,
            new_data=new_data,
            performed_by=performed_by,
            ip_address=ip_address,
        )
        self.db.add(log)
        await self.db.flush()   # commit은 서비스에서 일괄 처리
```

## Service 통합 패턴

```python
# services/pool_service.py
class PoolService:
    async def update(
        self,
        pool_id: int,
        data: PoolUpdateSchema,
        user: User,
        request: Request,
    ) -> Pool:
        pool = await self.repo.get_or_404(pool_id)

        # old_data 스냅샷
        old_dict = {c.name: getattr(pool, c.name)
                    for c in pool.__table__.columns}

        # 변경 적용 (reason 제외)
        update_fields = data.model_dump(
            exclude={"reason"}, exclude_none=True
        )
        for field, value in update_fields.items():
            setattr(pool, field, value)
        pool.updated_by = user.id
        await self.db.flush()

        # new_data 스냅샷
        new_dict = {c.name: getattr(pool, c.name)
                    for c in pool.__table__.columns}

        # 감사 로그 기록
        await AuditLogRepository(self.db).create(
            table_name="pools",
            record_id=pool_id,
            action="UPDATE",
            reason=data.reason,
            old_data=old_dict,
            new_data=new_dict,
            performed_by=user.id,
            ip_address=request.client.host,
        )

        await self.db.commit()
        await self.db.refresh(pool)
        return pool
```

## CREATE / DELETE 기록

```python
# CREATE
await AuditLogRepository(db).create(
    table_name="pools",
    record_id=new_pool.id,
    action="CREATE",
    new_data={c.name: getattr(new_pool, c.name)
              for c in new_pool.__table__.columns},
    performed_by=user.id,
    ip_address=request.client.host,
)

# DELETE
await AuditLogRepository(db).create(
    table_name="documents",
    record_id=doc_id,
    action="DELETE",
    reason=data.reason,
    old_data=old_dict,
    performed_by=user.id,
    ip_address=request.client.host,
)
```

## 조회

```sql
-- 특정 Pool 변경 이력
SELECT * FROM audit_logs
WHERE table_name = 'pools' AND record_id = :pool_id
ORDER BY performed_at DESC;

-- 특정 사용자 모든 활동
SELECT * FROM audit_logs
WHERE performed_by = :user_id
ORDER BY performed_at DESC;
```

## 적용 대상 (context/security-policy.md 기준)
pools / documents / notices / users(관리자 수정) / pool_participants
