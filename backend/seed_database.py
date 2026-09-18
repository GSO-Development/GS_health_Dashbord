"""
Master Database Seeder for GS Health Dashboard
Usage: python seed_database.py [--with-data]
"""
import os
import sys
from app.core.database import get_db_connection, init_db, ensure_database_exists
from app.core.security import hash_password

def seed_users():
    """
    Freshly seeds the users table with standard and admin credentials.
    Passwords are encrypted with bcrypt.
    """
    print("\n--- Seeding Users Table ---")
    conn = get_db_connection()
    try:
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
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_username (username),
                    INDEX idx_email (email)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
            
            admin_pwd = hash_password("Admin@GSH2026!")
            user_pwd  = hash_password("User@GSH2026!")

            # Insert or update default users directly into DB
            upsert_query = """
                INSERT INTO users (username, full_name, email, password, role, account_type)
                VALUES (%s, %s, %s, %s, %s, %s)
                ON DUPLICATE KEY UPDATE
                    full_name = VALUES(full_name),
                    email = VALUES(email),
                    password = VALUES(password),
                    role = VALUES(role),
                    account_type = VALUES(account_type);
            """
            cursor.execute(upsert_query, ("admin", "GSH Executive Admin", "admin@gsh.lk", admin_pwd, "admin", "system"))
            cursor.execute(upsert_query, ("user", "Standard Executive User", "user@gsh.lk", user_pwd, "user", "system"))
            
            print("  [OK] Admin user seeded: username='admin', email='admin@gsh.lk'")
            print("  [OK] Standard user seeded: username='user', email='user@gsh.lk'")
    finally:
        conn.close()

def main():
    print("==================================================")
    print("      GS Health Dashboard - User Seeder          ")
    print("==================================================")
    
    # 1. Initialize DB structure
    ensure_database_exists()
    init_db()
    print("[OK] Core database tables initialized.")

    # 2. Seed Users (admin & standard user)
    seed_users()

    print("\n==================================================")
    print("  [OK] User seeding completed successfully!        ")
    print("==================================================")

if __name__ == "__main__":
    main()
