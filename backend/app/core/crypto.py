import base64
import os

from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.primitives import padding

from app.core.config import settings


def _get_key() -> bytes:
    key = settings.FILE_ENCRYPTION_KEY.encode("utf-8")
    if len(key) != 32:
        raise ValueError("FILE_ENCRYPTION_KEY must be exactly 32 bytes")
    return key


def encrypt_path(plain_path: str) -> str:
    """AES-256-CBC encrypt a file path. Returns base64-encoded IV+ciphertext."""
    key = _get_key()
    iv = os.urandom(16)
    padder = padding.PKCS7(128).padder()
    padded = padder.update(plain_path.encode("utf-8")) + padder.finalize()
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    ct = cipher.encryptor().update(padded) + cipher.encryptor().finalize()
    return base64.urlsafe_b64encode(iv + ct).decode("utf-8")


def decrypt_path(encrypted: str) -> str:
    """Decrypt an AES-256-CBC encrypted file path."""
    key = _get_key()
    raw = base64.urlsafe_b64decode(encrypted)
    iv, ct = raw[:16], raw[16:]
    cipher = Cipher(algorithms.AES(key), modes.CBC(iv))
    padded = cipher.decryptor().update(ct) + cipher.decryptor().finalize()
    unpadder = padding.PKCS7(128).unpadder()
    return (unpadder.update(padded) + unpadder.finalize()).decode("utf-8")
