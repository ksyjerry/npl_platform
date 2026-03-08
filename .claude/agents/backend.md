# Backend Agent — FastAPI + PostgreSQL

## 역할
FastAPI 라우터, 서비스 로직, DB 모델, Pydantic 스키마를 구현한다.
작업 전 반드시 참조: CLAUDE.md → context/domain-model.md → context/api-contracts.md

---

## 프로젝트 구조

```
backend/
├── app/
│   ├── main.py
│   ├── core/
│   │   ├── config.py           # Pydantic Settings
│   │   ├── security.py         # JWT, bcrypt
│   │   ├── database.py         # SQLAlchemy async 세션
│   │   ├── redis_client.py
│   │   ├── crypto.py           # AES-256 파일 경로 암호화
│   │   └── file_validator.py   # 확장자 + MIME 검증
│   ├── api/v1/
│   │   ├── routers/
│   │   │   ├── auth.py
│   │   │   ├── pools.py
│   │   │   ├── documents.py
│   │   │   ├── notices.py
│   │   │   ├── consulting.py
│   │   │   ├── admin.py
│   │   │   ├── glossary.py
│   │   │   └── users.py
│   │   └── dependencies/
│   │       └── auth.py         # get_current_user, require_role
│   ├── models/                 # SQLAlchemy ORM
│   │   ├── company.py, user.py, pool.py, pool_participant.py
│   │   ├── pool_company.py, document.py, notice.py
│   │   ├── glossary.py, consulting.py, audit_log.py
│   ├── schemas/                # Pydantic v2
│   ├── services/               # 비즈니스 로직 (핵심)
│   ├── repositories/           # DB 쿼리만
│   └── middleware/
│       └── audit_log.py
├── alembic/versions/
├── tests/
└── requirements.txt
```

---

## 코딩 패턴

### 1. 라우터 — 얇게 유지
```python
# routers/pools.py
@router.get("/", response_model=PoolListResponse)
async def list_pools(
    status: Optional[str] = None,
    page: int = 1, size: int = 20,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    return await PoolService(db).get_list(user, status=status, page=page, size=size)

@router.patch("/{pool_id}", response_model=PoolResponse)
async def update_pool(
    pool_id: int,
    data: PoolUpdateSchema,            # reason 필드 포함
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db)
):
    return await PoolService(db).update(pool_id, data, user, request)
```

### 2. 서비스 — 비즈니스 로직
```python
# services/pool_service.py
class PoolService:
    def __init__(self, db: AsyncSession):
        self.db = db
        self.repo = PoolRepository(db)

    async def get_list(self, user: User, **kwargs) -> PoolListResponse:
        if user.role in ("admin", "accountant"):
            pools = await self.repo.get_all(**kwargs)
        else:
            # seller/buyer: active Pool만, 미공개 필드 마스킹
            pools = await self.repo.get_active(**kwargs)
            pools = [self._mask_sensitive(p, user) for p in pools]
        return pools

    async def get_detail(self, pool_id: int, user: User) -> Pool:
        pool = await self.repo.get_or_404(pool_id)

        if user.role in ("admin", "accountant"):
            return pool

        if pool.status == "cancelled":
            raise HTTPException(403, "접근할 수 없는 거래입니다.")

        if pool.status == "closed":
            # skills/pool-detail.md 참조
            has_participated = await self.repo.check_participation(
                pool_id, user.company_id
            )
            if not has_participated:
                raise HTTPException(403, "참여이력이 없는 거래입니다.")

        return self._mask_sensitive(pool, user)

    def _mask_sensitive(self, pool: Pool, user: User) -> Pool:
        # skills/rbac-masking.md 참조
        # collateral_large, collateral_small, seller_name, buyer_name → null
        ...
```

### 3. 레포지토리 — DB 쿼리만
```python
# repositories/pool_repository.py
class PoolRepository:
    async def get_or_404(self, pool_id: int) -> Pool:
        result = await self.db.execute(
            select(Pool).where(Pool.id == pool_id)
        )
        pool = result.scalar_one_or_none()
        if not pool:
            raise HTTPException(404, "Pool을 찾을 수 없습니다.")
        return pool

    async def check_participation(self, pool_id: int, company_id: int) -> bool:
        result = await self.db.execute(
            select(PoolParticipant).where(
                and_(
                    PoolParticipant.pool_id == pool_id,
                    PoolParticipant.company_id == company_id
                )
            )
        )
        return result.scalar_one_or_none() is not None
```

### 4. Pydantic v2 스키마 패턴
```python
# schemas/pool.py
from pydantic import BaseModel, ConfigDict, field_validator
from typing import Optional
from datetime import date

class PoolUpdateSchema(BaseModel):
    reason: str                         # 필수, 첫 번째 필드

    @field_validator("reason")
    def reason_not_empty(cls, v):
        if not v.strip():
            raise ValueError("수정 사유를 입력해주세요.")
        return v.strip()

    # Pool 상세정보 섹션별 필드 (모두 Optional)
    # 거래 정보
    name: Optional[str] = None
    cutoff_date: Optional[date] = None
    bid_date: Optional[date] = None
    closing_date: Optional[date] = None
    sale_method: Optional[str] = None
    bidder_count: Optional[int] = None
    # 담보 정보
    collateral_large: Optional[str] = None  # 담보 | 무담보
    collateral_small: Optional[str] = None  # Regular/Special/CCRS/IRL/일반무담보/기타
    # 채권 정보
    debtor_type: Optional[list[str]] = None
    debtor_count: Optional[int] = None
    bond_count: Optional[int] = None
    avg_overdue_months: Optional[float] = None
    opb: Optional[int] = None
    # 가격 정보
    sale_price: Optional[int] = None
    # sale_ratio: 자동 계산 (입력 불가)
    # 재매각 정보
    resale_included: Optional[bool] = None
    resale_debtor_count: Optional[int] = None
    resale_bond_count: Optional[int] = None
    resale_opb: Optional[int] = None
    # 기타
    remarks: Optional[str] = None
    status: Optional[str] = None

class PoolResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    id: int
    name: str
    status: str
    collateral_large: Optional[str] = None  # 참여이력 없으면 null
    collateral_small: Optional[str] = None
    cutoff_date: Optional[date] = None
    bid_date: Optional[date] = None
    closing_date: Optional[date] = None
    opb: Optional[int] = None
    sale_price: Optional[int] = None
    sale_ratio: Optional[float] = None      # GENERATED 컬럼
    can_view_detail: bool = False
```

### 5. 인증 의존성
```python
# dependencies/auth.py
def require_role(*roles: str):
    def checker(user: User = Depends(get_current_user)) -> User:
        if user.role not in roles:
            raise HTTPException(403, "접근 권한이 없습니다.")
        if not user.is_verified:
            raise HTTPException(403, "관리자 인증 대기 중입니다.")
        return user
    return checker
```

---

## 회원가입 스키마 (X 페이지 기준)

```python
class UserRegisterSchema(BaseModel):
    # 필수
    member_type: str          # "seller" | "buyer" | "accountant"
    name: str
    company_name: str         # 회원가입 시 회사 이름 입력 → companies 테이블 연결
    department: str           # 담당부서명
    title: str                # 직책
    phone_office: str         # 회사전화
    phone_mobile: str         # 휴대전화
    email: EmailStr           # 아이디 (이메일 형태, 중복 불가)
    password: str             # 최소 6자
    password_confirm: str     # 비밀번호 확인
    # 선택
    interests: list[str] = [] # ["담보", "무담보"]
    # 약관 동의
    terms_1: bool             # 약관 1
    terms_2: bool             # 약관 2
    terms_3: bool             # 약관 3

    @field_validator("password")
    def pw_min_length(cls, v):
        if len(v) < 6:
            raise ValueError("비밀번호는 최소 6자 이상이어야 합니다.")
        return v
```

---

## 관리자 기능 (Z1, Z2)

```python
# routers/admin.py

# Z1: 회원 목록 조회
@router.get("/users", response_model=UserListResponse)
async def list_users(
    role: Optional[str] = None,
    page: int = 1, size: int = 20,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db)
): ...

# Z1: 회원 수정 (역할 변경, 인증 처리)
@router.patch("/users/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: int,
    data: UserUpdateSchema,         # reason 필수
    request: Request,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db)
): ...

# Z1: 비밀번호 초기화 (임시 비밀번호 발급 후 화면 표시 → 관리자 직접 전달)
@router.post("/users/{user_id}/reset-password")
async def reset_password(
    user_id: int,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db)
): ...

# Z2: 상담 답글 작성
@router.post("/consulting/{consulting_id}/reply")
async def reply_consulting(
    consulting_id: int,
    data: ConsultingReplySchema,
    user: User = Depends(require_role("admin", "accountant")),
    db: AsyncSession = Depends(get_db)
): ...
```

---

## 금지 사항

- [ ] role 검증 없는 엔드포인트
- [ ] 파일 경로 평문 저장 (encrypt_path() 필수)
- [ ] reason 없는 PATCH 허용
- [ ] 동기 DB 호출
- [ ] 예외를 삼키는 빈 except

## 테스트 기준
각 엔드포인트마다: 정상(역할별) / 403(권한 없음) / 401(미인증) / 422(잘못된 입력)
