from typing import Optional
from fastapi import APIRouter, Body, HTTPException, Depends
from app.core.database import get_db_connection
import hashlib

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

def hash_password(password: str) -> str:
    """Hash password using SHA-256 for basic security"""
    return hashlib.sha256(password.encode('utf-8')).hexdigest()

def init_users_table():
    """Create users table if not exists and seed default admin & standard user"""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS users (
                id INT AUTO_INCREMENT PRIMARY KEY,
                username VARCHAR(50) NOT NULL UNIQUE,
                full_name VARCHAR(100) NOT NULL,
                email VARCHAR(100) NOT NULL UNIQUE,
                password VARCHAR(255) NOT NULL,
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)
        
        # Seed default Admin and User if empty
        cursor.execute("SELECT COUNT(*) as count FROM users;")
        count = cursor.fetchone()['count']
        if count == 0:
            admin_pass = hash_password("admin123")
            user_pass = hash_password("user123")
            
            cursor.execute("""
                INSERT INTO users (username, full_name, email, password, role)
                VALUES 
                ('admin', 'GSH Executive Admin', 'admin@gsh.lk', %s, 'admin'),
                ('user', 'Standard Executive User', 'user@gsh.lk', %s, 'user');
            """, (admin_pass, user_pass))
    conn.close()

@router.post("/login")
def login(payload: dict = Body(...)):
    """Authenticate user with username/password"""
    init_users_table()
    username = payload.get("username", "").strip()
    password = payload.get("password", "").strip()

    if not username or not password:
        raise HTTPException(status_code=400, detail="Username and password are required")

    hashed = hash_password(password)
    
    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Check matching user with plain or hashed password for convenience
        cursor.execute("""
            SELECT id, username, full_name, email, role 
            FROM users 
            WHERE (username = %s OR email = %s) AND (password = %s OR password = %s);
        """, (username, username, hashed, password))
        user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    # Generate token
    token = f"gsh_token_{user['id']}_{user['role']}"
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"]
        }
    }

@router.get("/me")
def get_current_user(token: str = ""):
    """Verify session token"""
    init_users_table()
    if not token or not token.startswith("gsh_token_"):
        raise HTTPException(status_code=401, detail="Invalid session token")

    parts = token.split("_")
    user_id = parts[2] if len(parts) >= 3 else 0

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT id, username, full_name, email, role FROM users WHERE id = %s;", (user_id,))
        user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    return {"user": user}
