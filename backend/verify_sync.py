from app.services.oracle_sync import sync_oracle_live
from app.core.database import get_db_connection
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("Starting sync (will load from CSV since Oracle driver not installed)...")
result = sync_oracle_live()
print("Sync status:", result["status"])

conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) as cnt FROM invoice_output;")
    inv = cursor.fetchone()["cnt"]
    cursor.execute("SELECT COUNT(*) as cnt FROM outstanding_output;")
    out = cursor.fetchone()["cnt"]
    print()
    print("MySQL TABLE COUNTS AFTER SYNC:")
    print("  invoice_output:     ", inv, "rows")
    print("  outstanding_output: ", out, "rows")

    cursor.execute("SELECT delivery_customer, invoice_no, catalog_no, net_dom_amount FROM invoice_output LIMIT 2;")
    print("\nSample invoice_output rows:")
    for r in cursor.fetchall():
        print("  ", dict(r))

    cursor.execute("SELECT customer_no, order_no, catalog_no, backlog_value_base_curr FROM outstanding_output LIMIT 2;")
    print("\nSample outstanding_output rows:")
    for r in cursor.fetchall():
        print("  ", dict(r))

conn.close()
