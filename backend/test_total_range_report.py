from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    # 1. Check distinct ranges from division_mappings
    cursor.execute("SELECT DISTINCT range_name FROM division_mappings WHERE range_name IS NOT NULL AND range_name != '' ORDER BY range_name ASC;")
    div_ranges = [r['range_name'] for r in cursor.fetchall()]
    print(f"Ranges from division_mappings ({len(div_ranges)}):")
    print(div_ranges[:10])

    # 2. Check total_budget columns and range_name / sales_group
    cursor.execute("SHOW COLUMNS FROM total_budget;")
    tb_cols = [c['Field'] for c in cursor.fetchall()]
    print("\ntotal_budget columns:", tb_cols[:12])

    # 3. Check sample total_budget data grouping by range_name or sales_group
    cursor.execute("SELECT range_name, SUM(july) as jul_b, SUM(april + may + june + july) as cum_b, SUM(total) as tot_b FROM total_budget GROUP BY range_name LIMIT 10;")
    rows = cursor.fetchall()
    print("\nSample total_budget grouped by range_name:")
    for r in rows:
        print("  ", r)

conn.close()
