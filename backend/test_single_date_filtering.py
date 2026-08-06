import sys
from app.core.database import get_db_connection

sys.stdout.reconfigure(encoding='utf-8')

conn = get_db_connection()
with conn.cursor() as cursor:
    # Full Month July 2026 Invoice Net Amount
    cursor.execute("SELECT SUM(net_dom_amount) as total FROM invoice_output WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026;")
    print("Full July 2026 Invoice Net Amount:", cursor.fetchone()['total'])

    # Single Date July 15, 2026 Invoice Net Amount
    cursor.execute("SELECT SUM(net_dom_amount) as total FROM invoice_output WHERE DATE(invoice_date) = %s;", ('2026-07-15',))
    print("Single Date 2026-07-15 Invoice Net Amount:", cursor.fetchone()['total'])

    # Single Date July 01, 2026 Invoice Net Amount
    cursor.execute("SELECT SUM(net_dom_amount) as total FROM invoice_output WHERE DATE(invoice_date) = %s;", ('2026-07-01',))
    print("Single Date 2026-07-01 Invoice Net Amount:", cursor.fetchone()['total'])

conn.close()
