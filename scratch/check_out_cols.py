import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cur:
    cur.execute("DESCRIBE outstanding_output;")
    cols = cur.fetchall()
    print("Columns in outstanding_output:")
    for c in cols:
        print(" ", c['Field'], c['Type'])

    # Total Invoices + Outstanding up to 2026-09-26 (Excl GSIEX, GSTEA, LTS)
    # Check the amount column in outstanding_output
    # Usually it is net_amount or total_amount or net_dom_amount or value
conn.close()
