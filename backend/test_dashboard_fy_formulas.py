from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Testing User-Defined Dashboard FY Formulas (July 2026) ===")

    # 1. TOTAL BUDGET vs ACTUAL
    cursor.execute("SELECT COALESCE(SUM(july), 0) as target FROM total_budget;")
    tot_budget = cursor.fetchone()['target']

    cursor.execute("SELECT COALESCE(SUM(net_dom_amount), 0) as inv FROM invoice_output WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026;")
    tot_inv = cursor.fetchone()['inv']

    cursor.execute("SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back FROM outstanding_output WHERE UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL;")
    tot_back = cursor.fetchone()['back']

    tot_actual = tot_inv + tot_back

    print(f"\n1. TOTAL BUDGET vs ACTUAL:")
    print(f"   Target (July total_budget): {tot_budget:,.2f}")
    print(f"   Invoice Net (July):        {tot_inv:,.2f}")
    print(f"   Outstanding (Non-GSTEA):   {tot_back:,.2f}")
    print(f"   TOTAL ACTUAL:              {tot_actual:,.2f}")
    print(f"   Achievement %:             {round((tot_actual / tot_budget) * 100) if tot_budget else 0}%")

    # 2. DIRECT BUDGET vs ACTUAL (Exclude CONTRACT = 'DISTRI')
    cursor.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as inv 
        FROM invoice_output 
        WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026
          AND (UPPER(TRIM(contract)) != 'DISTRI' OR contract IS NULL);
    """)
    dir_inv = cursor.fetchone()['inv']

    cursor.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back 
        FROM outstanding_output 
        WHERE (UPPER(TRIM(contract)) != 'DISTRI' OR contract IS NULL)
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    dir_back = cursor.fetchone()['back']

    dir_actual = dir_inv + dir_back

    print(f"\n2. DIRECT BUDGET vs ACTUAL (Excluding CONTRACT = 'DISTRI'):")
    print(f"   Direct Invoice Net:        {dir_inv:,.2f}")
    print(f"   Direct Outstanding Backlog:{dir_back:,.2f}")
    print(f"   DIRECT ACTUAL:             {dir_actual:,.2f}")

    # 3. DIS : PRI BUDGET vs ACTUAL (ONLY CONTRACT = 'DISTRI')
    cursor.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as inv 
        FROM invoice_output 
        WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026
          AND UPPER(TRIM(contract)) = 'DISTRI';
    """)
    dis_inv = cursor.fetchone()['inv']

    cursor.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back 
        FROM outstanding_output 
        WHERE UPPER(TRIM(contract)) = 'DISTRI';
    """)
    dis_back = cursor.fetchone()['back']

    dis_actual = dis_inv + dis_back

    print(f"\n3. DIS : PRI BUDGET vs ACTUAL (ONLY CONTRACT = 'DISTRI'):")
    print(f"   Dis Invoice Net:           {dis_inv:,.2f}")
    print(f"   Dis Outstanding Backlog:   {dis_back:,.2f}")
    print(f"   DIS : PRI ACTUAL:          {dis_actual:,.2f}")

    print(f"\nCheck Sum: Direct Actual ({dir_actual:,.2f}) + Dis Actual ({dis_actual:,.2f}) = {dir_actual + dis_actual:,.2f}")
    print(f"Compare with Total Actual: {tot_actual:,.2f}")

conn.close()
