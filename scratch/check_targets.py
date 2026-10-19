import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection
from app.routers.reports import get_total_range_fy

print("=== CHECKING BACKLOG MODES FOR 2026-09-01 to 2026-09-26 ===")
for b_mode in ["without", "with", "only"]:
    res = get_total_range_fy(month='september', date=None, start_date='2026-09-01', end_date='2026-09-26', search=None, backlog_mode=b_mode, contracts=None)
    totals = res['summary_totals']
    print(f"Mode '{b_mode}': M_Actual = {totals['m_actual']:,.2f} | C_Actual = {totals['c_actual']:,.2f} | A_Actual = {totals['a_actual']:,.2f}")

print("\n=== CHECKING BACKLOG MODES FOR FULL SEPTEMBER (No date range) ===")
for b_mode in ["without", "with", "only"]:
    res = get_total_range_fy(month='september', date=None, start_date=None, end_date=None, search=None, backlog_mode=b_mode, contracts=None)
    totals = res['summary_totals']
    print(f"Full Month Mode '{b_mode}': M_Actual = {totals['m_actual']:,.2f} | C_Actual = {totals['c_actual']:,.2f} | A_Actual = {totals['a_actual']:,.2f}")

conn = get_db_connection()
with conn.cursor() as cur:
    # Check outstanding output
    cur.execute("SELECT COALESCE(SUM(net_dom_amount), 0) as tot_out FROM outstanding_output WHERE (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);")
    tot_out = float(cur.fetchone()['tot_out'])
    print(f"\nTotal Outstanding (Excl GSIEX, GSTEA, LTS): {tot_out:,.2f}")

    # Check outstanding up to 2026-09-26
    cur.execute("SELECT COALESCE(SUM(net_dom_amount), 0) as tot_out_d FROM outstanding_output WHERE DATE(invoice_date) <= '2026-09-26' AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);")
    tot_out_d = float(cur.fetchone()['tot_out_d'])
    print(f"Total Outstanding up to 2026-09-26: {tot_out_d:,.2f}")

    # Let's search for values near 7,264,176,128.14 and 7,265,803,556.60
    target1 = 7264176128.14
    target2 = 7265803556.60
    diff_target = target2 - target1
    print(f"\nTarget 1: {target1:,.2f}")
    print(f"Target 2: {target2:,.2f}")
    print(f"Difference (Target2 - Target1): {diff_target:,.2f} ({diff_target/1000000:.2f} Mn)")

    # Check invoice_output sum including ALL dates in DB
    cur.execute("SELECT COALESCE(SUM(net_dom_amount), 0) as tot_all_db FROM invoice_output WHERE (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);")
    tot_all_db = float(cur.fetchone()['tot_all_db'])
    print(f"All invoices in DB (Excl GSIEX, GSTEA, LTS): {tot_all_db:,.2f}")

    # Check invoice sum for each month April to September
    print("\nMonthly Invoices in DB (Excl GSIEX, GSTEA, LTS):")
    cur.execute("""
        SELECT 
            DATE_FORMAT(invoice_date, '%Y-%m') as ym,
            COUNT(*) as cnt,
            SUM(net_dom_amount) as m_sum
        FROM invoice_output
        WHERE (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL)
        GROUP BY DATE_FORMAT(invoice_date, '%Y-%m')
        ORDER BY ym;
    """)
    for r in cur.fetchall():
        print(f"  {r['ym']}: Count = {r['cnt']} | Sum = Rs. {r['m_sum']:,.2f}")

conn.close()
