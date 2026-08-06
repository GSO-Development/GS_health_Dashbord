from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) as cnt FROM invoice_output;")
    inv_cnt = cursor.fetchone()["cnt"]
    cursor.execute("SELECT COUNT(*) as cnt FROM outstanding_output;")
    out_cnt = cursor.fetchone()["cnt"]
    print("invoice_output rows BEFORE truncate:", inv_cnt)
    print("outstanding_output rows BEFORE truncate:", out_cnt)

    cursor.execute("TRUNCATE TABLE invoice_output;")
    cursor.execute("TRUNCATE TABLE outstanding_output;")

    cursor.execute("SELECT COUNT(*) as cnt FROM invoice_output;")
    print("invoice_output rows AFTER truncate:", cursor.fetchone()["cnt"])
    cursor.execute("SELECT COUNT(*) as cnt FROM outstanding_output;")
    print("outstanding_output rows AFTER truncate:", cursor.fetchone()["cnt"])

conn.close()
print("Done. Both MySQL tables are now empty and ready for Oracle sync.")
