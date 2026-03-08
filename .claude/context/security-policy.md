# Security Policy — RBAC 매트릭스 & 보안 규칙

---

## RBAC 권한 매트릭스

| 기능 | admin | accountant | seller | buyer | pending |
|---|:---:|:---:|:---:|:---:|:---:|
| 홈 / 서비스 소개 | ✅ | ✅ | ✅ | ✅ | ✅ |
| 공지사항 열람 | ✅ | ✅ | 👁️ | 👁️ | ❌ |
| 공지사항 작성/수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| Pool 목록 | ✅ | ✅ | 👁️ 마스킹 | 👁️ 마스킹 | ❌ |
| Pool 상세 (active) | ✅ | ✅ | 👁️ 마스킹 | 👁️ 마스킹 | ❌ |
| Pool 상세 (closed+참여이력O) | ✅ | ✅ | ✅ | ✅ | ❌ |
| Pool 상세 (closed+참여이력X) | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ |
| Pool 상세 (cancelled) | ✅ | ✅ | ❌ (403) | ❌ (403) | ❌ |
| Pool 생성/수정 | ✅ | ✅ | ❌ | ❌ | ❌ |
| 거래자료 업로드 (seller탭) | ✅ | ✅ | ✅ | ❌ | ❌ |
| 거래자료 업로드 (buyer탭) | ✅ | ✅ | ❌ | ✅ | ❌ |
| 거래자료 업로드 (accountant탭) | ✅ | ✅ | ❌ | ❌ | ❌ |
| 거래자료 다운로드 (seller자료) | ✅ | ✅ | ✅ | ❌ | ❌ |
| 거래자료 다운로드 (buyer자료) | ✅ | ✅ | ❌ | ✅ | ❌ |
| 거래자료 다운로드 (accountant자료) | ✅ | ✅ | ❌ | ❌ | ❌ |
| 상담 신청 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 상담 답변 (Z2) | ✅ | ✅ | ❌ | ❌ | ❌ |
| 용어사전 열람 | ✅ | ✅ | 👁️ | 👁️ | ❌ |
| 마이페이지 | ✅ | ✅ | ✅ | ✅ | ❌ |
| 회원 목록/수정/삭제 (Z1) | ✅ | ✅ | ❌ | ❌ | ❌ |
| 비밀번호 초기화 | ✅ | ✅ | ❌ | ❌ | ❌ |

✅ = Read+Write | 👁️ = Read Only | ❌ = 접근 불가

---

## 마스킹 대상 필드 (seller/buyer가 조회 시)

```python
# 참여이력 없는 업체에게 null로 반환하는 필드
MASKED_FIELDS = [
    "collateral_large",    # Pool.collateral_large
    "collateral_small",    # Pool.collateral_small
    "seller_name",         # pool_companies (role='seller')
    "buyer_name",          # pool_companies (role='buyer')
]
# 나머지 (name, status, cutoff_date, bid_date, opb 등)는 공개
```

---

## 감사 로그 대상

| 테이블 | CREATE | UPDATE | DELETE |
|---|:---:|:---:|:---:|
| pools | ✅ | ✅ (reason 필수) | ✅ |
| documents | ✅ | ✅ (reason 필수) | ✅ |
| notices | ✅ | ✅ (reason 필수) | ✅ |
| users (관리자 수정) | ❌ | ✅ (reason 필수) | ✅ |
| pool_participants | ✅ | ❌ | ✅ |

---

## 파일 보안 규칙

| 항목 | 규칙 |
|---|---|
| 허용 확장자 | `.pdf .xlsx .xls .docx .doc .zip .csv .hwp` |
| 최대 크기 | 500MB (초과 시 413) |
| 저장 경로 형식 | `pools/{pool_id}/{role_type}/{uuid4()}_{원본파일명}` |
| DB 저장 | `file_path_enc` — AES-256-Fernet 암호화 필수 |
| 다운로드 | FastAPI `StreamingResponse` 경유 (직접 URL 금지) |
| 로그 기록 | 파일 내용 금지, 파일명·크기·업로더만 기록 |

---

## 인증 토큰 규칙

| 항목 | 규칙 |
|---|---|
| Access Token 유효기간 | 2시간 |
| Refresh Token 유효기간 | 7일 |
| Access Token 저장 | 메모리 변수 (localStorage 절대 금지) |
| Refresh Token 저장 | HttpOnly + Secure + SameSite=Strict 쿠키 |
| 로그아웃 | Redis에서 Refresh Token 즉시 삭제 |
| JWT payload | 비밀번호 해시, 개인식별정보 포함 금지 |

---

## MVP 비활성화 항목 (구조만 유지)

```python
# 매수인 IP 화이트리스트
# users.allowed_ips 컬럼 유지, 검증 로직만 주석 처리
async def verify_ip_if_buyer(request: Request, user: User):
    if user.role != "buyer":
        return
    # TODO: MVP 이후 활성화 (미결사항 #4)
    # if user.allowed_ips and request.client.host not in user.allowed_ips:
    #     raise HTTPException(403, "허가되지 않은 IP입니다.")
    pass
```

---

## SSO 전환 대비 (구조만 유지)

```python
# users.azure_oid 컬럼 유지 (MVP: NULL)
# 인증 로직 추상화
async def authenticate(method: str, credential: dict) -> User:
    if method == "email":
        return await _email_auth(credential)
    elif method == "azure_sso":    # 추후 활성화
        return await _azure_sso_auth(credential)
```
