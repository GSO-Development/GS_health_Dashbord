"""
Database Module Wrapper (re-exports from app.core.database for backward compatibility)
"""
from app.core.database import (
    MYSQL_HOST,
    MYSQL_PORT,
    MYSQL_USER,
    MYSQL_PASSWORD,
    MYSQL_DB,
    ensure_database_exists,
    get_db_connection,
    init_db,
    clear_database,
)

if __name__ == "__main__":
    init_db()
    print("MySQL database initialized! Keeping 'invoice_output' and 'outstanding_output'.")
