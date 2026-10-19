import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection
from app.routers.reports import get_total_range_fy

conn = get_db_connection()
with conn.cursor() as cur:
    # 1. Total Invoices (Excl GSIEX, GSTEA, LTS) 2026-04-01 to 2026-09-26
    cur.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as tot_inv
        FROM invoice_output
        WHERE DATE(invoice_date) >= '2026-04-01' AND DATE(invoice_date) <= '2026-09-26'
          AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);
    """)
    tot_inv = float(cur.fetchone()['tot_inv'])

    # 2. Total Outstanding (Excl GSIEX, GSTEA, LTS) up to 2026-09-26
    cur.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as tot_out
        FROM outstanding_output
        WHERE DATE(planned_delivery_date) >= '2026-04-01' AND DATE(planned_delivery_date) <= '2026-09-26'
          AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);
    """)
    tot_out = float(cur.fetchone()['tot_out'])

    # 3. Total Outstanding in entire DB (Excl GSIEX, GSTEA, LTS)
    cur.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as tot_out_all
        FROM outstanding_output
        WHERE (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);
    """)
    tot_out_all = float(cur.fetchone()['tot_out_all'])

    # Combined raw database sum
    raw_combined = tot_inv + tot_out
    print(f"Raw Invoices (2026-04-01 to 2026-09-26): {tot_inv:,.2f}")
    print(f"Raw Backlog Outstanding (up to 2026-09-26): {tot_out:,.2f}")
    print(f"Raw Combined Total (Invoices + Backlog up to Sept 26): {raw_combined:,.2f}")

    # Check unmapped backlog in outstanding_output
    cur.execute("""
        SELECT DISTINCT LOWER(TRIM(sales_group)) as sg FROM division_mappings WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
        UNION
        SELECT DISTINCT LOWER(TRIM(sales_group)) as sg FROM total_budget WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';
    """)
    mapped_sgs = set(r['sg'] for r in cur.fetchall() if r.get('sg'))

    cur.execute("""
        SELECT 
            catalog_group, catalog_no, catalog_desc, contract, planned_delivery_date, backlog_value_base_curr
        FROM outstanding_output
        WHERE DATE(planned_delivery_date) >= '2026-04-01' AND DATE(planned_delivery_date) <= '2026-09-26'
          AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);
    """)
    out_rows = cur.fetchall()
    unmapped_out = [r for r in out_rows if (r.get('catalog_group') or '').strip().lower() not in mapped_sgs]
    print(f"\nUnmapped Outstanding records count: {len(unmapped_out)}")
    unmapped_out_sum = sum(r['backlog_value_base_curr'] for r in unmapped_out)
    print(f"Unmapped Outstanding total sum: Rs. {unmapped_out_sum:,.2f}")
    for u in unmapped_out:
        print(f"  - Group: {u['catalog_group']} | Part: {u['catalog_no']} | Desc: {u['catalog_desc']} | Date: {str(u['planned_delivery_date'])[:10]} | Rs. {u['backlog_value_base_curr']:,.2f}")

    # Now let's compare with user's target:
    user_expected = 7265803556.60
    user_current = 7264176128.14
    user_gap = user_expected - user_current
    print(f"\n--- USER FIGURES ---")
    print(f"User Original Expected: {user_expected:,.2f}")
    print(f"User Current in Page:   {user_current:,.2f}")
    print(f"User Gap:               {user_gap:,.2f} (Rs. 1,627,428.46 / 1.99 Mn)")
    print(f"Our Raw Combined:       {raw_combined:,.2f}")
    print(f"Difference (Expected - Raw Combined): {user_expected - raw_combined:,.2f}")

conn.close()
