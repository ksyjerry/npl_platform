from pathlib import Path

from fastapi import HTTPException

ALLOWED_EXTENSIONS = {
    ".pdf", ".xlsx", ".xls", ".docx", ".doc",
    ".zip", ".csv", ".hwp",
}

ALLOWED_MIME_TYPES = {
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "application/zip",
    "application/x-zip-compressed",
    "text/csv",
    "application/x-hwp",
    "application/haansofthwp",
    "application/octet-stream",  # some .hwp files report this
}

MAX_FILE_SIZE = 500 * 1024 * 1024  # 500MB


def validate_upload(filename: str, content: bytes) -> None:
    """Validate file extension, size, and MIME type."""
    ext = Path(filename).suffix.lower()
    if ext not in ALLOWED_EXTENSIONS:
        raise HTTPException(400, f"허용되지 않는 파일 형식입니다: {ext}")

    if len(content) > MAX_FILE_SIZE:
        raise HTTPException(413, "파일 크기가 500MB를 초과합니다.")

    # MIME type check via python-magic
    try:
        import magic
        mime = magic.from_buffer(content[:2048], mime=True)
        if mime not in ALLOWED_MIME_TYPES:
            raise HTTPException(400, f"파일 내용이 확장자와 일치하지 않습니다. (감지된 타입: {mime})")
    except ImportError:
        # python-magic not available (e.g., in test environment) — skip MIME check
        pass
