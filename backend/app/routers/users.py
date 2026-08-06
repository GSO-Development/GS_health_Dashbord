from typing import Optional
from fastapi import APIRouter, Body, HTTPException
from app.core.database import get_db_connection
import hashlib

router = APIRouter(prefix="/api/users", tags=["User Management"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@router.get("")
def list_users():
    """Fetch list of all users"""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username, full_name, email, role, created_at FROM users ORDER BY created_at DESC;")
        users = cursor.fetchall()
    conn.close()
    return {"users": users}

@router.post("")
def create_user(payload: dict = Body(...)):
    """Create new user account (Admin only)"""
    username = payload.get("username", "").strip()
    full_name = payload.get("full_name", "").strip()
    email = payload.get("email", "").strip()
    password = payload.get("password", "").strip()
    role = payload.get("role", "user").strip().lower()

    if not username or not full_name or not email or not password:
        raise HTTPException(status_code=400, detail="All fields are required")

    if role not in ["admin", "user"]:
        role = "user"

    hashed = hash_password(password)

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Check if username or email exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s;", (username, email))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail="Username or email already exists")

        cursor.execute("""
            INSERT INTO users (username, full_name, email, password, role)
            VALUES (%s, %s, %s, %s, %s);
        """, (username, full_name, email, hashed, role))
        user_id = cursor.lastrowid
    conn.close()

    return {"success": True, "user_id": user_id, "message": f"User '{username}' created successfully as {role}"}

@router.delete("/{user_id}")
def delete_user(user_id: int):
    """Delete a user account (Admin only)"""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username FROM users WHERE id = %s;", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute("DELETE FROM users WHERE id = %s;", (user_id,))
    conn.close()
    return {"success": True, "message": f"User '{user['username']}' deleted successfully"}
