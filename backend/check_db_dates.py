import sys
import pymysql
from app.core.database import get_db_connection

sys.stdout.reconfigure(encoding='utf-8')
conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("SELECT MIN(invoice_date) as min_d, MAX(invoice_date) as max_d, COUNT(*) as cnt FROM invoice_output;")
    print("invoice_output dates:", cursor.fetchone())

    cursor.execute("SELECT MIN(entry_date) as min_d, MAX(entry_date) as max_d, COUNT(*) as cnt FROM axienta_data;")
    print("axienta_data dates:", cursor.fetchone())

    cursor.execute("SELECT DATE(invoice_date) as d, COUNT(*) as cnt, SUM(net_dom_amount) as total FROM invoice_output WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026 GROUP BY d LIMIT 10;")
    print("\nSample July 2026 invoice dates:")
    for r in cursor.fetchall():
        print(" ", r)

conn.close()
