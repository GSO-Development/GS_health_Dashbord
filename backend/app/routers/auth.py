import os
import hashlib
import json
import urllib.parse
import urllib.request
from typing import Optional
from fastapi import APIRouter, Body, HTTPException, Query
from fastapi.responses import RedirectResponse
from app.core.database import get_db_connection

router = APIRouter(prefix="/api/auth", tags=["Authentication"])

# Microsoft Azure AD (Entra ID) OAuth Config
AZURE_CLIENT_ID = os.getenv("AZURE_CLIENT_ID", "5e0cce25-8863-4546-b82c-7746f232378a")
AZURE_CLIENT_SECRET = os.getenv("AZURE_CLIENT_SECRET", "dc~8Q~4qYdUpyEVlTxb-9hdo0GTK-ONDgex0hb27")
AZURE_TENANT_ID = os.getenv("AZURE_TENANT_ID", "e146d540-8607-402e-a38e-441e00d4ec27")
AZURE_REDIRECT_URI = os.getenv("AZURE_REDIRECT_URI", "http://localhost:8000/api/auth/microsoft/callback")
FRONTEND_BASE_URL = os.getenv("FRONTEND_BASE_URL", "http://localhost:5173")

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
                password VARCHAR(255) DEFAULT '',
                role VARCHAR(20) NOT NULL DEFAULT 'user',
                account_type VARCHAR(20) DEFAULT 'system',
                azure_oid VARCHAR(100) DEFAULT NULL,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)
        
        # Ensure columns exist if table was previously created
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'system';")
        except Exception:
            pass
        try:
            cursor.execute("ALTER TABLE users ADD COLUMN azure_oid VARCHAR(100) DEFAULT NULL;")
        except Exception:
            pass

        # Seed default Admin and User if empty
        cursor.execute("SELECT COUNT(*) as count FROM users;")
        count = cursor.fetchone()['count']
        if count == 0:
            admin_pass = hash_password("admin123")
            user_pass = hash_password("user123")
            
            cursor.execute("""
                INSERT IGNORE INTO users (username, full_name, email, password, role, account_type)
                VALUES 
                ('admin', 'GSH Executive Admin', 'admin@gsh.lk', %s, 'admin', 'system'),
                ('user', 'Standard Executive User', 'user@gsh.lk', %s, 'user', 'system');
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
        cursor.execute("""
            SELECT id, username, full_name, email, role, account_type 
            FROM users 
            WHERE (username = %s OR email = %s) AND (password = %s OR password = %s);
        """, (username, username, hashed, password))
        user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=401, detail="Invalid username or password")

    token = f"gsh_token_{user['id']}_{user['role']}"
    
    return {
        "success": True,
        "token": token,
        "user": {
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "account_type": user.get("account_type", "system")
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
        cursor.execute("SELECT id, username, full_name, email, role, account_type FROM users WHERE id = %s;", (user_id,))
        user = cursor.fetchone()
    conn.close()

    if not user:
        raise HTTPException(status_code=404, detail="User profile not found")

    return {"user": user}

# ── Microsoft Azure AD (Entra ID) OAuth Endpoints ─────────────────────────

@router.get("/microsoft/url")
def get_microsoft_auth_url(redirect_uri: Optional[str] = None):
    """Generate Microsoft Azure AD OAuth Login URL"""
    callback_url = redirect_uri or AZURE_REDIRECT_URI
    params = {
        "client_id": AZURE_CLIENT_ID,
        "response_type": "code",
        "redirect_uri": callback_url,
        "response_mode": "query",
        "scope": "openid profile email User.Read",
        "state": "gsh_azure_auth"
    }
    url = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/authorize?" + urllib.parse.urlencode(params)
    return {"url": url}

@router.get("/microsoft/callback")
def microsoft_callback(code: str = Query(None), error: str = Query(None), state: str = Query(None), redirect_uri: Optional[str] = None):
    """Handle Microsoft OAuth Callback, Exchange Code for Token & Authenticate User"""
    init_users_table()
    
    frontend_url = os.getenv("FRONTEND_URL", "http://localhost:5173")
    
    if error or not code:
        err_msg = error or "Authorization code missing"
        return RedirectResponse(url=f"{frontend_url}/login?error={urllib.parse.quote(err_msg)}")

    callback_url = redirect_uri or AZURE_REDIRECT_URI
    token_url = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/token"
    
    token_data = urllib.parse.urlencode({
        "client_id": AZURE_CLIENT_ID,
        "client_secret": AZURE_CLIENT_SECRET,
        "code": code,
        "grant_type": "authorization_code",
        "redirect_uri": callback_url
    }).encode("utf-8")

    try:
        req = urllib.request.Request(token_url, data=token_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
        with urllib.request.urlopen(req) as resp:
            token_resp = json.loads(resp.read().decode("utf-8"))
            access_token = token_resp.get("access_token")

        if not access_token:
            return RedirectResponse(url=f"{frontend_url}/login?error=token_failed")

        # Get Microsoft Graph User Profile (/v1.0/me)
        me_req = urllib.request.Request("https://graph.microsoft.com/v1.0/me", headers={"Authorization": f"Bearer {access_token}"})
        with urllib.request.urlopen(me_req) as me_resp:
            profile = json.loads(me_resp.read().decode("utf-8"))

        email = profile.get("mail") or profile.get("userPrincipalName") or ""
        azure_oid = profile.get("id") or ""
        full_name = profile.get("displayName") or email.split("@")[0]

        if not email:
            return RedirectResponse(url=f"{frontend_url}/login?error=no_email")

        # Check if email is registered in users database table
        conn = get_db_connection()
        with conn.cursor() as cursor:
            cursor.execute("SELECT id, username, full_name, email, role FROM users WHERE email = %s OR azure_oid = %s;", (email, azure_oid))
            user = cursor.fetchone()
        conn.close()

        if not user:
            # User is NOT registered in database table
            return RedirectResponse(url=f"{frontend_url}/login?error=not_registered&email={urllib.parse.quote(email)}")

        # User IS registered -> Generate session token and redirect to frontend
        token = f"gsh_token_{user['id']}_{user['role']}"
        user_json = urllib.parse.quote(json.dumps({
            "id": user["id"],
            "username": user["username"],
            "full_name": user["full_name"],
            "email": user["email"],
            "role": user["role"],
            "account_type": "microsoft"
        }))
        
        return RedirectResponse(url=f"{frontend_url}/login?token={token}&user={user_json}")

    except Exception as e:
        print("Microsoft OAuth Error:", str(e))
        return RedirectResponse(url=f"{frontend_url}/login?error={urllib.parse.quote(str(e))}")

# Helper to get Microsoft Graph Application Token
def get_graph_app_token():
    token_url = f"https://login.microsoftonline.com/{AZURE_TENANT_ID}/oauth2/v2.0/token"
    token_data = urllib.parse.urlencode({
        "client_id": AZURE_CLIENT_ID,
        "client_secret": AZURE_CLIENT_SECRET,
        "grant_type": "client_credentials",
        "scope": "https://graph.microsoft.com/.default"
    }).encode("utf-8")
    
    req = urllib.request.Request(token_url, data=token_data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    with urllib.request.urlopen(req) as resp:
        res = json.loads(resp.read().decode("utf-8"))
        return res.get("access_token")

@router.get("/microsoft/search-users")
def search_microsoft_users(q: str = Query("")):
    """Search Microsoft Graph API for organizational users by email/name using server-side $filter"""
    if not q or len(q.strip()) < 2:
        return {"users": []}

    search_query = q.strip()

    try:
        access_token = get_graph_app_token()
        if not access_token:
            return {"users": [], "error": "Failed to authenticate with Microsoft Graph API"}

        # Use $filter with startsWith for displayName and mail - server-side, fast search
        encoded_q = urllib.parse.quote(search_query)
        graph_url = (
            f"https://graph.microsoft.com/v1.0/users"
            f"?$select=id,displayName,mail,userPrincipalName"
            f"&$filter=startsWith(displayName,'{search_query}') or startsWith(mail,'{search_query}') or startsWith(userPrincipalName,'{search_query}')"
            f"&$top=15"
            f"&$orderby=displayName"
        )

        req = urllib.request.Request(graph_url, headers={
            "Authorization": f"Bearer {access_token}",
            "ConsistencyLevel": "eventual"
        })

        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode("utf-8"))
            all_users = data.get("value", [])

        matched = []
        for u in all_users:
            mail = u.get("mail") or u.get("userPrincipalName") or ""
            name = u.get("displayName") or ""
            if mail:  # Only include users with a valid email
                matched.append({
                    "azure_oid": u.get("id"),
                    "displayName": name,
                    "mail": mail,
                    "userPrincipalName": u.get("userPrincipalName") or mail
                })

        return {"users": matched}

    except Exception as e:
        err_str = str(e)
        print("Microsoft Graph User Search Error:", err_str)
        # Fallback: fetch all and filter client-side (slower but works without ConsistencyLevel)
        try:
            access_token = get_graph_app_token()
            graph_url = "https://graph.microsoft.com/v1.0/users?$select=id,displayName,mail,userPrincipalName&$top=100"
            req = urllib.request.Request(graph_url, headers={"Authorization": f"Bearer {access_token}"})
            with urllib.request.urlopen(req) as resp:
                data = json.loads(resp.read().decode("utf-8"))
                all_users = data.get("value", [])
            
            q_lower = search_query.lower()
            matched = []
            for u in all_users:
                mail = u.get("mail") or u.get("userPrincipalName") or ""
                name = u.get("displayName") or ""
                if (q_lower in name.lower() or q_lower in mail.lower()) and mail:
                    matched.append({
                        "azure_oid": u.get("id"),
                        "displayName": name,
                        "mail": mail,
                        "userPrincipalName": u.get("userPrincipalName") or mail
                    })
            return {"users": matched}
        except Exception as e2:
            return {"users": [], "error": str(e2)}
