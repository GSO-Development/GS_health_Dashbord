from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Raw Budget & Actual Sums (No /1000 division) ===")
    
    ranges_to_test = ['ADCOCK', 'AEROMED', 'ALPAYA', 'ALTIVON', 'ARROWIL A1']
    
    for r_name in ranges_to_test:
        # Budget
        cursor.execute("""
            SELECT 
                SUM(july) as jul_b,
                SUM(april + may + june + july) as cum_b,
                SUM(total) as tot_b
            FROM total_budget b
            WHERE LOWER(TRIM(b.range_name)) = LOWER(%s)
               OR b.sales_group IN (SELECT sales_group FROM division_mappings WHERE LOWER(TRIM(range_name)) = LOWER(%s));
        """, (r_name, r_name))
        b = cursor.fetchone()

        # Monthly Actual (July 2026)
        cursor.execute("""
            SELECT COALESCE(SUM(i.net_dom_amount), 0) as act
            FROM invoice_output i
            LEFT JOIN division_mappings m ON i.catalog_group = m.sales_group
            WHERE (LOWER(TRIM(m.range_name)) = LOWER(%s) OR LOWER(TRIM(i.catalog_group)) = LOWER(%s))
              AND MONTH(i.invoice_date) = 7 AND YEAR(i.invoice_date) = 2026;
        """, (r_name, r_name))
        m_act = cursor.fetchone()['act']

        jul_b = float(b['jul_b'] or 0)
        cum_b = float(b['cum_b'] or 0)
        tot_b = float(b['tot_b'] or 0)
        m_act_val = float(m_act or 0)

        cur_pct = round((m_act_val / jul_b) * 100) if jul_b > 0 else 0

        print(f"\nDivision Range: {r_name}")
        print(f"  Monthly Budget: {jul_b:,.2f}  |  Monthly Actual: {m_act_val:,.2f}  |  Cur %: {cur_pct}%")
        print(f"  Cum Budget (4M): {cum_b:,.2f}")
        print(f"  Annual Budget:   {tot_b:,.2f}")

conn.close()
