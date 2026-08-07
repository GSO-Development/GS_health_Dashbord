"""
Security utilities:
- JWT token creation & verification (python-jose)
- Password hashing with bcrypt (no salt needed separately — bcrypt auto-salts)
- FastAPI dependency: get_current_user / require_admin
"""
import os
import logging
from datetime import datetime, timedelta, timezone
from typing import Optional

import bcrypt
from fastapi import Header, HTTPException, status
from jose import JWTError, jwt

# ── Load env ─────────────────────────────────────────────────────────────────
from dotenv import load_dotenv
load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

JWT_SECRET_KEY: str = os.getenv("JWT_SECRET_KEY", "CHANGE_THIS_IN_PRODUCTION_MIN_32_CHARS!!")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRE_HOURS: int = int(os.getenv("JWT_EXPIRE_HOURS", "8"))

# ── Audit Logger ─────────────────────────────────────────────────────────────
audit_logger = logging.getLogger("gsh.audit")

# ── Password helpers ──────────────────────────────────────────────────────────

def hash_password(plain: str) -> str:
    """Hash password using bcrypt (auto-salts each call)."""
    return bcrypt.hashpw(plain.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    """Verify a bcrypt-hashed password."""
    try:
        return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))
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
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired session token.",
        )


# ── FastAPI dependencies ──────────────────────────────────────────────────────

def get_token_from_header(authorization: str = Header(default="")) -> str:
    """Extract Bearer token from Authorization header."""
    if authorization.startswith("Bearer "):
        return authorization[len("Bearer "):]
    # Fallback: legacy token passed as raw header value
    if authorization.startswith("gsh_token_"):
        # Legacy token — reject with helpful message
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
