from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("DESCRIBE invoice_output;")
    cols_inv = [row['Field'] for row in cursor.fetchall()]
    print("invoice_output columns:", cols_inv)

    cursor.execute("DESCRIBE outstanding_output;")
    cols_out = [row['Field'] for row in cursor.fetchall()]
    print("outstanding_output columns:", cols_out)

conn.close()
