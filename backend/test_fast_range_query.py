from app.core.database import get_db_connection
import time

t0 = time.time()
conn = get_db_connection()
with conn.cursor() as cursor:
    # 1. Fetch all distinct ranges from division_mappings in A-Z order
    cursor.execute("""
        SELECT DISTINCT TRIM(range_name) as range_name 
        FROM division_mappings 
        WHERE range_name IS NOT NULL AND TRIM(range_name) != '' 
        ORDER BY range_name ASC;
    """)
    div_ranges = [r['range_name'] for r in cursor.fetchall()]

    cursor.execute("""
        SELECT DISTINCT TRIM(range_name) as range_name 
        FROM total_budget 
        WHERE range_name IS NOT NULL AND TRIM(range_name) != '';
    """)
    tb_ranges = [r['range_name'] for r in cursor.fetchall()]

    all_ranges = sorted(list(set(div_ranges + tb_ranges)))

    # 2. Get budget grouped by range_name from total_budget
    cursor.execute("""
        SELECT 
            COALESCE(TRIM(b.range_name), m.range_name) as r_name,
            SUM(b.april) as apr_b, SUM(b.may) as may_b, SUM(b.june) as jun_b, SUM(b.july) as jul_b,
            SUM(b.august) as aug_b, SUM(b.september) as sep_b, SUM(b.october) as oct_b,
            SUM(b.november) as nov_b, SUM(b.december) as dec_b, SUM(b.january) as jan_b,
            SUM(b.february) as feb_b, SUM(b.march) as mar_b, SUM(b.total) as tot_b
        FROM total_budget b
        LEFT JOIN division_mappings m ON b.sales_group = m.sales_group
        GROUP BY r_name;
    """)
    b_map = {}
    for r in cursor.fetchall():
        rn = r['r_name']
        if rn:
            b_map[rn.strip().lower()] = r

    # 3. Get invoice_output actuals grouped by range_name
    cursor.execute("""
        SELECT 
            COALESCE(TRIM(m.range_name), TRIM(i.catalog_group)) as r_name,
            MONTH(i.invoice_date) as inv_m,
            SUM(i.net_dom_amount) as total_act
        FROM invoice_output i
        LEFT JOIN division_mappings m ON i.catalog_group = m.sales_group
        GROUP BY r_name, inv_m;
    """)
    inv_map = {}
    for r in cursor.fetchall():
        rn = r['r_name']
        if rn:
            key = (rn.strip().lower(), r['inv_m'])
            inv_map[key] = float(r['total_act'] or 0)

    # 4. Get outstanding_output backlog grouped by range_name
    cursor.execute("""
        SELECT 
            COALESCE(TRIM(m.range_name), TRIM(o.catalog_group)) as r_name,
            SUM(o.backlog_value_base_curr) as total_back
        FROM outstanding_output o
        LEFT JOIN division_mappings m ON o.catalog_group = m.sales_group
        GROUP BY r_name;
    """)
    back_map = {}
    for r in cursor.fetchall():
        rn = r['r_name']
        if rn:
            back_map[rn.strip().lower()] = float(r['total_back'] or 0)

conn.close()
t1 = time.time()
print(f"Optimized Query execution time: {t1 - t0:.4f} seconds!")
print(f"Total Ranges fetched: {len(all_ranges)}")
