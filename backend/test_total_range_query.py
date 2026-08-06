from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    # 1. Fetch all unique ranges from division_mappings in A-Z order
    cursor.execute("""
        SELECT DISTINCT TRIM(range_name) as range_name 
        FROM division_mappings 
        WHERE range_name IS NOT NULL AND TRIM(range_name) != '' 
        ORDER BY range_name ASC;
    """)
    all_ranges = [r['range_name'] for r in cursor.fetchall()]

    # Also check if total_budget has any ranges not in division_mappings
    cursor.execute("""
        SELECT DISTINCT TRIM(range_name) as range_name 
        FROM total_budget 
        WHERE range_name IS NOT NULL AND TRIM(range_name) != '';
    """)
    tb_ranges = [r['range_name'] for r in cursor.fetchall()]
    
    for tr in tb_ranges:
        if tr not in all_ranges:
            all_ranges.append(tr)
    all_ranges.sort()

    print(f"Total Unique Ranges (A to Z) ({len(all_ranges)}):")
    print(all_ranges)

    print("\n--- Testing Aggregation for top 5 Ranges (Values in 000' LKR) ---")
    month = "july"
    
    # Cumulative budget columns (April, May, June, July)
    cum_b_sql = "COALESCE(SUM(april + may + june + july), 0)"
    ann_b_sql = "COALESCE(SUM(total), 0)"
    cur_b_sql = f"COALESCE(SUM({month}), 0)"

    for r_name in all_ranges[:5]:
        # Budget from total_budget matching range_name OR matching sales_group mapped to range_name
        cursor.execute(f"""
            SELECT 
                {cur_b_sql} as cur_b,
                {cum_b_sql} as cum_b,
                {ann_b_sql} as ann_b
            FROM total_budget b
            WHERE LOWER(TRIM(b.range_name)) = LOWER(%s)
               OR b.sales_group IN (SELECT sales_group FROM division_mappings WHERE LOWER(TRIM(range_name)) = LOWER(%s));
        """, (r_name, r_name))
        b_res = cursor.fetchone()
        
        # Monthly Actual from invoice_output
        cursor.execute("""
            SELECT COALESCE(SUM(i.net_dom_amount), 0) as act
            FROM invoice_output i
            LEFT JOIN division_mappings m ON i.catalog_group = m.sales_group
            WHERE (LOWER(TRIM(m.range_name)) = LOWER(%s) OR LOWER(TRIM(i.catalog_group)) = LOWER(%s))
              AND MONTH(i.invoice_date) = 7 AND YEAR(i.invoice_date) = 2026;
        """, (r_name, r_name))
        m_act_res = cursor.fetchone()['act']

        # Cumulative Actual (April-July) from invoice_output
        cursor.execute("""
            SELECT COALESCE(SUM(i.net_dom_amount), 0) as act
            FROM invoice_output i
            LEFT JOIN division_mappings m ON i.catalog_group = m.sales_group
            WHERE (LOWER(TRIM(m.range_name)) = LOWER(%s) OR LOWER(TRIM(i.catalog_group)) = LOWER(%s))
              AND i.invoice_date >= '2026-04-01' AND i.invoice_date <= '2026-07-31';
        """, (r_name, r_name))
        c_act_res = cursor.fetchone()['act']

        # Outstanding Backlog
        cursor.execute("""
            SELECT COALESCE(SUM(o.backlog_value_base_curr), 0) as back
            FROM outstanding_output o
            LEFT JOIN division_mappings m ON o.catalog_group = m.sales_group
            WHERE LOWER(TRIM(m.range_name)) = LOWER(%s) OR LOWER(TRIM(o.catalog_group)) = LOWER(%s);
        """, (r_name, r_name))
        back_res = cursor.fetchone()['back']

        cur_b_val = round((b_res['cur_b'] or 0) / 1000, 1)
        cum_b_val = round((b_res['cum_b'] or 0) / 1000, 1)
        ann_b_val = round((b_res['ann_b'] or 0) / 1000, 1)

        m_act_val = round(((m_act_res or 0) + (back_res or 0)) / 1000, 1)
        c_act_val = round(((c_act_res or 0) + (back_res or 0)) / 1000, 1)
        a_act_val = c_act_val

        cur_pct = round((m_act_val / cur_b_val) * 100) if cur_b_val > 0 else 0
        cum_pct = round((c_act_val / cum_b_val) * 100) if cum_b_val > 0 else 0
        tot_pct = round((a_act_val / ann_b_val) * 100) if ann_b_val > 0 else 0

        print(f"\nDivision Range: {r_name}")
        print(f"  Monthly: Budget = {cur_b_val:,.1f}k | Actual = {m_act_val:,.1f}k | % = {cur_pct}%")
        print(f"  Cum (4M): Budget = {cum_b_val:,.1f}k | Actual = {c_act_val:,.1f}k | % = {cum_pct}%")
        print(f"  Annual:  Budget = {ann_b_val:,.1f}k | Actual = {a_act_val:,.1f}k | % = {tot_pct}%")

conn.close()
