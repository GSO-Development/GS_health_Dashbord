from typing import Optional
from fastapi import APIRouter, Body, HTTPException
from app.core.database import get_db_connection
import hashlib

router = APIRouter(prefix="/api/users", tags=["User Management"])

def hash_password(password: str) -> str:
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

@router.get("")
def list_users():
    """Fetch list of all users with account types"""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username, full_name, email, role, account_type, azure_oid, created_at FROM users ORDER BY created_at DESC;")
        users = cursor.fetchall()
    conn.close()
    
    # Return formatted users
    for u in users:
        if not u.get("account_type"):
            u["account_type"] = "system"
            
    return {"users": users}

@router.post("")
def create_user(payload: dict = Body(...)):
    """Create new user account (Admin only) - Supports 'system' and 'microsoft' accounts"""
    account_type = payload.get("account_type", "system").strip().lower()
    role = payload.get("role", "user").strip().lower()
    if role not in ["admin", "user"]:
        role = "user"

    email = payload.get("email", "").strip()
    full_name = payload.get("full_name", "").strip()
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()
    azure_oid = payload.get("azure_oid", None)

    if account_type == "microsoft":
        if not email or not full_name:
            raise HTTPException(status_code=400, detail="Email address and Full Name are required for Microsoft user")
        if not username:
            username = email.split("@")[0].lower()
        hashed = ""
    else:
        account_type = "system"
        if not username or not full_name or not email or not password:
            raise HTTPException(status_code=400, detail="All fields (Username, Full Name, Email, Password) are required for System user")
        hashed = hash_password(password)

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Check if username or email already exists
        cursor.execute("SELECT id FROM users WHERE username = %s OR email = %s;", (username, email))
        existing = cursor.fetchone()
        if existing:
            conn.close()
            raise HTTPException(status_code=400, detail=f"User with username '{username}' or email '{email}' already exists")

        cursor.execute("""
            INSERT INTO users (username, full_name, email, password, role, account_type, azure_oid)
            VALUES (%s, %s, %s, %s, %s, %s, %s);
        """, (username, full_name, email, hashed, role, account_type, azure_oid))
        user_id = cursor.lastrowid
    conn.close()

    return {
        "success": True, 
        "user_id": user_id, 
        "message": f"{account_type.capitalize()} user '{full_name}' created successfully as {role}"
    }

@router.delete("/{user_id}")
def delete_user(user_id: int):
    """Delete a user account (Admin only)"""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username, full_name FROM users WHERE id = %s;", (user_id,))
        user = cursor.fetchone()
        if not user:
            conn.close()
            raise HTTPException(status_code=404, detail="User not found")

        cursor.execute("DELETE FROM users WHERE id = %s;", (user_id,))
    conn.close()
    return {"success": True, "message": f"User '{user['full_name']}' deleted successfully"}
