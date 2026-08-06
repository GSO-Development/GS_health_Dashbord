from app.core.database import get_db_connection

def init_axienta_table():
    conn = get_db_connection()
    with conn.cursor() as cursor:
        print("Creating axienta_data MySQL table if not exists...")
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS axienta_data (
                id INT AUTO_INCREMENT PRIMARY KEY,
                entry_date DATE NOT NULL,
                product_id VARCHAR(100),
                product VARCHAR(255),
                qty DOUBLE DEFAULT 0,
                value DOUBLE DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                INDEX idx_entry_date (entry_date)
            );
        """)
        conn.commit()
        print("axienta_data table ready!")
    conn.close()

if __name__ == "__main__":
    init_axienta_table()
