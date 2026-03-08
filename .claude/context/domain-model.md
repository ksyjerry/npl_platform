# Domain Model — ERD & 테이블 전체 정의

> 화면설계서 Draft v2 기준. 변경 시 Alembic 마이그레이션 필수.

---

## ERD 요약

```
companies ──< users ──< documents
    │              │
    └──< pool_companies    pool_participants >──┐
              │                                │
           pools >─────────────────────────────┘
              │
    ┌─────────┼──────────┬─────────────┐
  notices  documents  consultings  audit_logs
                                   (INSERT ONLY)
glossary  (독립)
```

---

## 테이블 정의

### companies (회사)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(200) NOT NULL | 회사명 |
| type | VARCHAR(20) NOT NULL | `seller` \| `buyer` \| `accountant` |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**예시 시드:**
- (1, '삼일회계법인', 'accountant')
- (2, 'OO저축은행', 'seller')
- (3, 'OO F&I', 'buyer')

---

### users (사용자)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| azure_oid | VARCHAR(100) UNIQUE | SSO 전환용 예약 (MVP: NULL) |
| email | VARCHAR(200) UNIQUE NOT NULL | 로그인 ID (이메일 형태) |
| hashed_password | VARCHAR(200) NOT NULL | bcrypt |
| name | VARCHAR(100) NOT NULL | 이름 |
| company_id | INT FK → companies | 소속 회사 |
| department | VARCHAR(100) | 담당부서명 |
| title | VARCHAR(50) | 직책 |
| phone_office | VARCHAR(20) | 회사전화 |
| phone_mobile | VARCHAR(20) | 휴대전화 |
| role | VARCHAR(20) DEFAULT 'pending' | `admin`\|`accountant`\|`seller`\|`buyer`\|`pending` |
| is_verified | BOOLEAN DEFAULT FALSE | 관리자 인증 여부 |
| interests | TEXT[] DEFAULT '{}' | ['담보', '무담보'] |
| allowed_ips | TEXT[] DEFAULT '{}' | 매수인 IP 화이트리스트 (MVP: 미사용) |
| last_login_at | TIMESTAMPTZ | |
| last_login_ip | VARCHAR(45) | 접속IP (마이페이지·Z1 표시용) |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**비즈니스 규칙:**
- 가입 직후: role='pending', is_verified=false
- 관리자가 Z1에서 역할 부여 + is_verified=true 로 변경 시 서비스 이용 가능
- `is_verified=false` 상태에서 API 호출 → 403

---

### pools (거래 Pool)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| name | VARCHAR(300) NOT NULL | 예: PwC-SB 2026-1 Program |
| status | VARCHAR(20) DEFAULT 'active' | `active`(진행)\|`closed`(종결)\|`cancelled`(중단) |
| collateral_large | VARCHAR(20) | `담보`\|`무담보` |
| collateral_small | VARCHAR(50) | Regular/Special/CCRS&IRL/일반무담보/기타 |
| cutoff_date | DATE | 자산확정일 |
| bid_date | DATE | 입찰기일 |
| closing_date | DATE | 거래종결일 |
| sale_method | VARCHAR(50) | 제한적 경쟁입찰 / 수의계약 등 |
| bidder_count | INT | 최종 입찰 참여자 수 |
| debtor_type | TEXT[] | ['개인','개인사업자','법인'] |
| debtor_count | INT | 차주수 |
| bond_count | INT | 채권수 |
| avg_overdue_months | NUMERIC(5,1) | 평균 연체기간(개월) |
| opb | BIGINT | 원금잔액(원) |
| sale_price | BIGINT | 양수도가격(원) |
| sale_ratio | NUMERIC(7,4) GENERATED ALWAYS AS (CASE WHEN opb > 0 THEN sale_price::NUMERIC/opb ELSE NULL END) STORED | 매각가율 (자동계산) |
| resale_included | BOOLEAN DEFAULT FALSE | 재매각채권 포함 여부 |
| resale_debtor_count | INT | 재매각 차주수 |
| resale_bond_count | INT | 재매각 채권수 |
| resale_opb | BIGINT | 재매각 OPB(원) |
| remarks | TEXT | 비고 |
| created_by | INT FK → users | |
| updated_by | INT FK → users | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ | |

**정렬 기준:** status 우선순위 active(0) → closed(1) → cancelled(2)

**미공개 필드 4개** (참여이력 없는 업체에게 null 반환):
`collateral_large`, `collateral_small`, + pool_companies에서 조회하는 `seller_name`, `buyer_name`

---

### pool_participants (Pool 참여이력)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| pool_id | INT FK → pools | PK(복합) |
| company_id | INT FK → companies | PK(복합) |
| participated_at | TIMESTAMPTZ DEFAULT now() | |

**역할:** closed Pool 상세정보 열람 권한의 핵심 테이블.
관리자(accountant/admin)가 수동으로 참여 업체를 등록한다.

---

### pool_companies (거래 참여회사 — 양도인/양수인)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| pool_id | INT FK → pools | |
| company_id | INT FK → companies | |
| role | VARCHAR(20) NOT NULL | `seller`(양도인)\|`buyer`(양수인) |
| advisor | VARCHAR(200) | 자문사명 |
| buyer_checklist_ok | BOOLEAN | 양수인 점검표 확인 여부 |

---

### documents (거래자료)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| pool_id | INT FK → pools | |
| uploader_id | INT FK → users | |
| role_type | VARCHAR(20) NOT NULL | `seller`\|`buyer`\|`accountant` |
| file_name | VARCHAR(500) NOT NULL | 원본 파일명 (화면 표시용) |
| file_path_enc | TEXT NOT NULL | **AES-256 암호화된 파일 서버 경로** |
| file_size | BIGINT | bytes |
| memo | TEXT | 메모 (🗒️ 아이콘) |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ | |

**접근 규칙:**
- role_type='seller'     → seller, accountant, admin
- role_type='buyer'      → buyer, accountant, admin
- role_type='accountant' → accountant, admin

**저장 경로 형식:** `pools/{pool_id}/{role_type}/{uuid}_{원본파일명}`

---

### notices (공지사항)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| pool_id | INT FK → pools (nullable) | NULL이면 전체(전체) 공지 |
| category | VARCHAR(200) | 구분: '전체' 또는 거래명(예: PwC-SB 2026-1 Program) |
| title | VARCHAR(500) NOT NULL | 제목 |
| content | TEXT | 내용 |
| file_name | VARCHAR(500) | 첨부파일 원본명 (💾 아이콘) |
| file_path_enc | TEXT | 첨부파일 암호화 경로 |
| created_by | INT FK → users | |
| created_at | TIMESTAMPTZ DEFAULT now() | |
| updated_at | TIMESTAMPTZ | |

---

### glossary (용어 사전)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| term | VARCHAR(200) NOT NULL | 용어명 |
| definition | TEXT NOT NULL | 설명 |
| sort_order | INT DEFAULT 0 | 표시 순서 |

**초기 seed 데이터 (11개 — CLAUDE.md 섹션 7 참조):**
NPL, 자산확정일(Cut-off Date), 매각대상자산, Data Disk,
Invitation Letter(IL), 입찰참가의향서(LOI), 비밀유지서약서(NDA),
적격 투자자, Bid Package, 자산양수도계약서(LSPA), Interim

---

### consultings (상담)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | SERIAL PK | |
| user_id | INT FK → users | 신청자 |
| type | VARCHAR(20) NOT NULL | `selling`(매각 상담)\|`buying`(인수 상담) |
| title | VARCHAR(500) NOT NULL | 상담 제목 |
| content | TEXT NOT NULL | 상담 내용 |
| status | VARCHAR(20) DEFAULT 'pending' | `pending`(답변 대기)\|`replied`(답변 완료) |
| reply | TEXT | 답변 내용 (Z2 답글 작성) |
| replied_by | INT FK → users | 답변자 |
| replied_at | TIMESTAMPTZ | |
| created_at | TIMESTAMPTZ DEFAULT now() | |

**연결 경로:**
- type='selling' ← B1 매각 자문 페이지의 '매각 상담 신청' 버튼
- type='buying'  ← B2 인수 자문 페이지의 '인수 상담 신청' 버튼

---

### audit_logs (감사 로그 — INSERT ONLY)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | BIGSERIAL PK | |
| table_name | VARCHAR(100) NOT NULL | 변경된 테이블명 |
| record_id | INT NOT NULL | 변경된 레코드 ID |
| action | VARCHAR(20) NOT NULL | `CREATE`\|`UPDATE`\|`DELETE` |
| reason | TEXT | **수정 사유 (UPDATE/DELETE 필수)** |
| old_data | JSONB | 변경 전 전체 레코드 |
| new_data | JSONB | 변경 후 전체 레코드 |
| performed_by | INT FK → users | 수행자 |
| performed_at | TIMESTAMPTZ DEFAULT now() | |
| ip_address | VARCHAR(45) NOT NULL | 요청 IP |

**규칙:** UPDATE / DELETE 금지 (PostgreSQL RLS 또는 앱 레벨 강제).
금융 규제 대응 및 감독당국 보고용.

**감사 로그 대상 테이블:**
- pools (CREATE / UPDATE / DELETE)
- documents (CREATE / UPDATE / DELETE)
- notices (CREATE / UPDATE / DELETE)
- users (관리자가 수정할 때만 UPDATE)
- pool_participants (CREATE / DELETE)

---

## 핵심 비즈니스 로직 요약

### 1. Pool 열람 권한
```
[Pool 목록]
  admin/accountant : 모든 Pool, 모든 필드
  seller/buyer     : 모든 Pool, 미공개 필드 4개 → null

[Pool 상세]
  admin/accountant : 모든 Pool
  seller/buyer     :
    active    → 기본 정보만 (미공개 필드 null)
    closed    → pool_participants에 company_id 있어야 전체 열람
    cancelled → 403 접근 불가
```

### 2. 거래자료 접근
```
role_type='seller'     → seller, accountant, admin
role_type='buyer'      → buyer, accountant, admin
role_type='accountant' → accountant, admin
```

### 3. 매각가율 자동 계산 (PostgreSQL GENERATED)
```sql
sale_ratio = CASE WHEN opb > 0 THEN sale_price::NUMERIC / opb ELSE NULL END
```

### 4. Pool 정렬
```sql
ORDER BY
  CASE status WHEN 'active' THEN 0 WHEN 'closed' THEN 1 ELSE 2 END,
  created_at DESC
```
