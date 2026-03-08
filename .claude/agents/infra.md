# Infra Agent — Docker / Azure / 환경 설정

## 역할
로컬 개발환경(docker-compose), Azure 배포 구성, 환경변수 관리를 담당한다.
파일 서버 모드 전환(mock → azure_blob → file_server)을 제어한다.

---

## 환경 단계

| 환경 | 구성 | FILE_SERVER_MODE |
|---|---|---|
| 로컬 | docker-compose | `mock` (컨테이너 내 /tmp/uploads) |
| 스테이징 | Azure App Service (dev slot) | `azure_blob` |
| 운영 | Azure App Service (prod slot) | `file_server` (PwC 내부 서버) |

---

## docker-compose.yml (로컬 개발)

```yaml
version: "3.9"

services:
  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile.dev
    ports: ["3000:3000"]
    volumes:
      - ./frontend:/app
      - /app/node_modules
      - /app/.next
    environment:
      NEXT_PUBLIC_API_URL: http://localhost:8000
    depends_on: [backend]

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile.dev
    ports: ["8000:8000"]
    volumes:
      - ./backend:/app
      - ./uploads:/tmp/uploads      # mock 파일 저장소
    env_file: ./backend/.env
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started

  db:
    image: postgres:16-alpine
    environment:
      POSTGRES_USER: npl
      POSTGRES_PASSWORD: npl
      POSTGRES_DB: npl_db
    volumes: [pg_data:/var/lib/postgresql/data]
    ports: ["5432:5432"]
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U npl"]
      interval: 5s
      timeout: 5s
      retries: 5

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pg_data:
```

---

## 환경변수 전체 목록

### backend/.env
```env
# ── 데이터베이스
DATABASE_URL=postgresql+asyncpg://npl:npl@db:5432/npl_db

# ── Redis
REDIS_URL=redis://redis:6379

# ── JWT
JWT_SECRET_KEY=<256bit 랜덤 문자열 — 절대 하드코딩 금지>
JWT_ACCESS_EXPIRE_HOURS=2
JWT_REFRESH_EXPIRE_DAYS=7

# ── 파일 스토리지 (환경별로 하나만 활성화)
FILE_SERVER_MODE=mock                       # mock | azure_blob | file_server
LOCAL_UPLOAD_DIR=/tmp/uploads               # mock 전용
# AZURE_STORAGE_CONNECTION=DefaultEndpoints... # azure_blob 전용
# AZURE_STORAGE_CONTAINER=npl-files           # azure_blob 전용
# FILE_SERVER_API_URL=https://...             # file_server 전용
# FILE_SERVER_API_KEY=...                     # file_server 전용

# ── 파일 암호화 (AES-256, 32byte)
FILE_ENCRYPTION_KEY=<32자 랜덤 키 — 절대 하드코딩 금지>

# ── CORS
ALLOWED_ORIGINS=http://localhost:3000

# ── (SSO 전환 시 활성화)
# AZURE_AD_TENANT_ID=
# AZURE_AD_CLIENT_ID=
# AZURE_AD_CLIENT_SECRET=
```

### frontend/.env.local
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Dockerfile (개발용)

### backend/Dockerfile.dev
```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]
```

### frontend/Dockerfile.dev
```dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json .
RUN npm ci
CMD ["npm", "run", "dev"]
```

---

## Dockerfile (운영용)

### backend/Dockerfile
```dockerfile
FROM python:3.12-slim AS builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM python:3.12-slim
WORKDIR /app
COPY --from=builder /usr/local/lib/python3.12/site-packages \
                    /usr/local/lib/python3.12/site-packages
COPY . .
EXPOSE 8000
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--workers", "2"]
```

### frontend/Dockerfile
```dockerfile
FROM node:20-alpine AS builder
WORKDIR /app
COPY package*.json .
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

---

## Azure 리소스 (MVP)

```bash
# 리소스 그룹
az group create --name rg-npl-platform --location koreacentral

# App Service Plan (B2 = 2코어/3.5GB, 최소 권장)
az appservice plan create \
  --name asp-npl --resource-group rg-npl-platform \
  --sku B2 --is-linux

# Backend App Service
az webapp create \
  --name npl-api --resource-group rg-npl-platform \
  --plan asp-npl --runtime "PYTHON|3.12"

# Frontend App Service
az webapp create \
  --name npl-web --resource-group rg-npl-platform \
  --plan asp-npl --runtime "NODE|20-lts"

# PostgreSQL Flexible Server
az postgres flexible-server create \
  --name npl-db --resource-group rg-npl-platform \
  --location koreacentral \
  --admin-user npl_admin \
  --sku-name Standard_B2ms --tier Burstable --version 16

# Redis Cache (Basic C0 = MVP 최소)
az redis create \
  --name npl-redis --resource-group rg-npl-platform \
  --location koreacentral --sku Basic --vm-size C0

# Container Registry
az acr create \
  --name nplregistry --resource-group rg-npl-platform --sku Basic
```

---

## 파일 서버 모드 전환 절차

```
[mock → azure_blob]
1. AZURE_STORAGE_CONNECTION, AZURE_STORAGE_CONTAINER 환경변수 설정
2. FILE_SERVER_MODE=azure_blob 으로 변경
3. 기존 mock 업로드 파일 Azure Blob으로 이전 (필요 시)
4. App Service 재시작 (코드 변경 없음)

[azure_blob → file_server]
1. FILE_SERVER_API_URL, FILE_SERVER_API_KEY 환경변수 설정
2. IT팀에 PwC 내부 파일 서버 HTTP API 접근 허용 요청
3. FILE_SERVER_MODE=file_server 로 변경
4. App Service 재시작
```

---

## .gitignore 필수 항목

```gitignore
# 환경변수
.env
.env.local
.env.*.local
backend/.env

# 업로드 파일 (mock 모드)
uploads/

# 빌드 결과물
frontend/.next/
backend/__pycache__/
*.pyc
```

---

## 금지 사항

- [ ] `.env` 파일 git 커밋
- [ ] JWT_SECRET_KEY · FILE_ENCRYPTION_KEY 기본값을 운영에 사용
- [ ] 운영 DB 직접 수동 변경 (Alembic 마이그레이션 사용)
- [ ] Docker 이미지에 환경변수 하드코딩
