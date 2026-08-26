"""
Security utilities:
- JWT token creation & verification using PyJWT or python-jose
- Password hashing with bcrypt
- FastAPI dependency: get_current_user / require_admin
"""
import os
import logging
import hashlib
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt

# Try importing jwt from python-jose or PyJWT
try:
    from jose import jwt, JWTError
    JWT_EXPIRED_EXC = JWTError
    JWT_INVALID_EXC = JWTError
except ImportError:
    try:
        import jwt
        JWT_EXPIRED_EXC = jwt.ExpiredSignatureError
        JWT_INVALID_EXC = jwt.InvalidTokenError
    except ImportError:
        raise RuntimeError("Neither python-jose nor PyJWT is installed in Python environment.")

from fastapi import Header, HTTPException, status

# ── Simple .env loader (standard library) ───────────────────────────────────
def load_env_file():
    env_path = os.path.join(os.path.dirname(__file__), "..", "..", ".env")
    if os.path.isfile(env_path):
        try:
            with open(env_path, "r", encoding="utf-8") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        os.environ.setdefault(k.strip(), v.strip())
        except Exception:
            pass

load_env_file()

JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS!!")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

# ── Audit Logger ─────────────────────────────────────────────────────────────
audit_logger = logging.getLogger("gsh.audit")

# ── Password helpers (bcrypt + legacy SHA-256 fallback) ───────────────────────

def hash_password(plain: str) -> str:
    """Hash password using bcrypt."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a password using bcrypt (or legacy SHA-256 fallback)."""
    if not hashed or not plain:
        return False
    try:
        # Check if stored hash is bcrypt ($2b$, $2a$, $2y$)
        if hashed.startswith("$2b$") or hashed.startswith("$2a$") or hashed.startswith("$2y$"):
            return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
        
        # Legacy SHA-256 fallback for existing accounts
        legacy_sha = hashlib.sha256(plain.encode("utf-8")).hexdigest()
        return legacy_sha == hashed
    except Exception:
        return False


# ── JWT helpers ───────────────────────────────────────────────────────────────

def create_access_token(user_id: int, role: str) -> str:
    """Create a signed JWT access token."""
    expire = datetime.now(timezone.utc) + timedelta(hours=JWT_EXPIRE_HOURS)
    payload = {
        "sub": str(user_id),
        "role": role,
        "exp": expire,
        "iat": datetime.now(timezone.utc),
    }
    return jwt.encode(payload, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)


def decode_access_token(token: str) -> dict:
    """Decode and verify a JWT. Raises HTTPException on failure."""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except JWT_EXPIRED_EXC:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Session token has expired. Please login again.",
        )
    except JWT_INVALID_EXC:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid session token.",
        )
    except Exception:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Failed to authenticate token.",
        )


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def get_token_from_header(authorization: str = Header(default="")) -> str:
    """Extract Bearer token from Authorization header."""
    if authorization.startswith("Bearer "):
        return authorization[len("Bearer "):]
    if authorization.startswith("gsh_token_"):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Legacy token format. Please log in again.",
        )
    raise HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Missing or invalid Authorization header.",
    )


def get_current_user(authorization: str = Header(default="")) -> dict:
    """Dependency: Returns decoded token payload for any authenticated user."""
    token = get_token_from_header(authorization)
    return decode_access_token(token)


def require_admin(authorization: str = Header(default="")) -> dict:
    """Dependency: Returns decoded payload only if role == 'admin'."""
    token = get_token_from_header(authorization)
    payload = decode_access_token(token)
    if payload.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin privileges required.",
        )
    return payload
