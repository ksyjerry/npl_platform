from pathlib import Path
from uuid import uuid4

from fastapi import HTTPException

from app.core.config import settings


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


class FileStorageService:
    def __init__(self):
        mode = settings.FILE_SERVER_MODE
        if mode == "mock":
            self._backend = LocalDiskBackend(settings.LOCAL_UPLOAD_DIR)
        elif mode == "azure_blob":
            # Future: AzureBlobBackend
            raise NotImplementedError("Azure Blob storage not yet implemented")
        elif mode == "file_server":
            # Future: FileServerBackend
            raise NotImplementedError("File server backend not yet implemented")
        else:
            raise ValueError(f"Unknown FILE_SERVER_MODE: {mode}")

    def build_path(self, pool_id: int, role_type: str, filename: str) -> str:
        safe_name = f"{uuid4()}_{Path(filename).name}"
        return f"pools/{pool_id}/{role_type}/{safe_name}"

    async def save(self, path: str, content: bytes) -> None:
        await self._backend.save(path, content)

    async def read_stream(self, path: str):
        return await self._backend.read_stream(path)

    async def delete(self, path: str) -> None:
        await self._backend.delete(path)


# Singleton for dependency injection
_storage: FileStorageService | None = None


def get_storage() -> FileStorageService:
    global _storage
    if _storage is None:
        _storage = FileStorageService()
    return _storage
