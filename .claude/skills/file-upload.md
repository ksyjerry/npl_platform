# Skill: File Upload — 파일 처리 패턴

## 원칙
- 파일 경로는 절대 클라이언트에 노출하지 않는다
- DB에는 **AES-256 암호화된 경로**만 저장한다
- 다운로드는 반드시 FastAPI `StreamingResponse` 경유
- 확장자 + MIME 타입 이중 검증 필수

---

## 저장 경로 규칙

```
pools/{pool_id}/{role_type}/{uuid4()}_{원본파일명}
notices/{notice_id}/{uuid4()}_{원본파일명}

예시:
  pools/1/seller/a3f9b2c1-4d5e-4f6a-b7c8-d9e0f1a2b3c4_DataDisk.xlsx
  notices/3/a1b2c3d4-..._수정 일정표.xlsx
```

---

## 암호화 유틸 (core/crypto.py)

```python
import os, base64
from cryptography.fernet import Fernet

def _get_cipher() -> Fernet:
    raw = os.environ["FILE_ENCRYPTION_KEY"].encode()
    # 32바이트로 맞추고 base64url 인코딩
    key = base64.urlsafe_b64encode(raw[:32].ljust(32, b"0"))
    return Fernet(key)

def encrypt_path(path: str) -> str:
    return _get_cipher().encrypt(path.encode()).decode()

def decrypt_path(enc: str) -> str:
    return _get_cipher().decrypt(enc.encode()).decode()
```

---

## 파일 검증 (core/file_validator.py)

```python
from pathlib import Path
import magic   # pip install python-magic

ALLOWED_EXTENSIONS = {
    ".pdf", ".xlsx", ".xls", ".docx", ".doc",
    ".zip", ".csv", ".hwp"
}
ALLOWED_MIMES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/zip",
    "application/x-zip-compressed",
    "text/csv",
    "application/x-hwp",
}
MAX_BYTES = 500 * 1024 * 1024   # 500MB

def validate_upload(filename: str, content: bytes) -> None:
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"허용되지 않는 파일 형식: {ext}")
    if len(content) > MAX_BYTES:
        raise HTTPException(413, "파일 크기가 500MB를 초과합니다.")
    mime = magic.from_buffer(content[:2048], mime=True)
    if mime not in ALLOWED_MIMES:
        raise HTTPException(400, "파일 내용이 확장자와 일치하지 않습니다.")
```

---

## FileStorageService (추상화 레이어)

```python
# services/file_storage.py
import os
from uuid import uuid4
from pathlib import Path

class FileStorageService:
    def __init__(self):
        mode = os.environ.get("FILE_SERVER_MODE", "mock")
        if mode == "mock":
            self._b = LocalDiskBackend(os.environ["LOCAL_UPLOAD_DIR"])
        elif mode == "azure_blob":
            self._b = AzureBlobBackend(
                os.environ["AZURE_STORAGE_CONNECTION"],
                os.environ["AZURE_STORAGE_CONTAINER"],
            )
        elif mode == "file_server":
            self._b = FileServerBackend(
                os.environ["FILE_SERVER_API_URL"],
                os.environ["FILE_SERVER_API_KEY"],
            )
        else:
            raise ValueError(f"Unknown FILE_SERVER_MODE: {mode}")

    def build_path(self, pool_id: int, role_type: str, filename: str) -> str:
        safe = f"{uuid4()}_{Path(filename).name}"
        return f"pools/{pool_id}/{role_type}/{safe}"

    def build_notice_path(self, notice_id: int, filename: str) -> str:
        safe = f"{uuid4()}_{Path(filename).name}"
        return f"notices/{notice_id}/{safe}"

    async def save(self, path: str, content: bytes) -> None:
        await self._b.save(path, content)

    async def read_stream(self, path: str):
        return await self._b.read_stream(path)

    async def delete(self, path: str) -> None:
        await self._b.delete(path)


class LocalDiskBackend:
    def __init__(self, base_dir: str):
        self.base = Path(base_dir)

    async def save(self, path: str, content: bytes) -> None:
        full = self.base / path
        full.parent.mkdir(parents=True, exist_ok=True)
        full.write_bytes(content)

    async def read_stream(self, path: str):
        full = self.base / path
        if not full.exists():
            raise HTTPException(404, "파일을 찾을 수 없습니다.")
        def generator():
            with open(full, "rb") as f:
                while chunk := f.read(65536):
                    yield chunk
        return generator()

    async def delete(self, path: str) -> None:
        full = self.base / path
        if full.exists():
            full.unlink()
```

---

## 업로드 엔드포인트 전체 패턴

```python
# routers/documents.py
from urllib.parse import quote

@router.post("/upload", status_code=201)
async def upload_document(
    file: UploadFile,
    pool_id: int = Form(...),
    role_type: str = Form(...),
    memo: str | None = Form(None),
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    # 1. 역할 검증
    ALLOWED = {
        "seller":     ["seller", "accountant", "admin"],
        "buyer":      ["buyer",  "accountant", "admin"],
        "accountant": ["accountant", "admin"],
    }
    if user.role not in ALLOWED.get(role_type, []):
        raise HTTPException(403, "해당 유형 파일을 업로드할 권한이 없습니다.")

    # 2. 파일 검증
    content = await file.read()
    validate_upload(file.filename, content)

    # 3. 저장
    path = storage.build_path(pool_id, role_type, file.filename)
    await storage.save(path, content)

    # 4. DB 저장 (암호화 경로)
    doc = Document(
        pool_id=pool_id,
        uploader_id=user.id,
        role_type=role_type,
        file_name=file.filename,
        file_path_enc=encrypt_path(path),
        file_size=len(content),
        memo=memo,
    )
    db.add(doc)

    # 5. 감사 로그
    await db.flush()
    await AuditLogRepository(db).create(
        table_name="documents", record_id=doc.id, action="CREATE",
        new_data={"file_name": doc.file_name, "role_type": role_type,
                  "pool_id": pool_id, "file_size": len(content)},
        performed_by=user.id, ip_address=request.client.host,
    )
    await db.commit()
    return doc
```

---

## 다운로드 엔드포인트 전체 패턴

```python
@router.get("/{doc_id}/download")
async def download_document(
    doc_id: int,
    user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
    storage: FileStorageService = Depends(get_storage),
):
    doc = await DocumentRepository(db).get_or_404(doc_id)

    # 역할 검증
    ALLOWED = {
        "seller":     ["seller", "accountant", "admin"],
        "buyer":      ["buyer",  "accountant", "admin"],
        "accountant": ["accountant", "admin"],
    }
    if user.role not in ALLOWED.get(doc.role_type, []):
        raise HTTPException(403, "파일 다운로드 권한이 없습니다.")

    path = decrypt_path(doc.file_path_enc)
    stream = await storage.read_stream(path)

    return StreamingResponse(
        stream,
        media_type="application/octet-stream",
        headers={
            "Content-Disposition":
                f"attachment; filename*=UTF-8''{quote(doc.file_name)}"
        },
    )
```
