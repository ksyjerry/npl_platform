from pydantic_settings import BaseSettings
from typing import Optional


class Settings(BaseSettings):
    # Database
    DATABASE_URL: str

    # Redis
    REDIS_URL: str = "redis://redis:6379"

    # JWT
    JWT_SECRET_KEY: str
    JWT_ACCESS_EXPIRE_HOURS: int = 2
    JWT_REFRESH_EXPIRE_DAYS: int = 7

    # File Storage
    FILE_SERVER_MODE: str = "mock"  # mock | azure_blob | file_server
    LOCAL_UPLOAD_DIR: str = "/tmp/uploads"
    AZURE_STORAGE_CONNECTION: Optional[str] = None
    AZURE_STORAGE_CONTAINER: Optional[str] = None
    FILE_SERVER_API_URL: Optional[str] = None
    FILE_SERVER_API_KEY: Optional[str] = None

    # File Encryption (AES-256, 32 bytes)
    FILE_ENCRYPTION_KEY: str

    # CORS
    ALLOWED_ORIGINS: str = "http://localhost:3000"

    # Azure AD (SSO - future)
    AZURE_AD_TENANT_ID: Optional[str] = None
    AZURE_AD_CLIENT_ID: Optional[str] = None
    AZURE_AD_CLIENT_SECRET: Optional[str] = None

    model_config = {
        "env_file": ".env",
        "env_file_encoding": "utf-8",
    }

    @property
    def cors_origins(self) -> list[str]:
        return [o.strip() for o in self.ALLOWED_ORIGINS.split(",")]


settings = Settings()
