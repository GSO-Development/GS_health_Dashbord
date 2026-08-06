from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Testing DIRECT BUDGET vs ACTUAL Adjusted Formulas (July 2026) ===")

    # 1. DIRECT ACTUAL
    # invoice_output: cust_grp != 'DISTRI' AND contract != 'GSTEA'
    cursor.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as inv_net 
        FROM invoice_output 
        WHERE MONTH(invoice_date) = 7 AND YEAR(invoice_date) = 2026 
          AND (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    dir_inv_net = cursor.fetchone()['inv_net'] or 0.0

    # outstanding_output: cust_grp != 'DISTRI' AND contract != 'GSTEA'
    cursor.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back_val 
        FROM outstanding_output 
        WHERE (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    dir_out_back = cursor.fetchone()['back_val'] or 0.0

    direct_actual = dir_inv_net + dir_out_back

    # 2. DIRECT BUDGET (Target): SUM(primary_target) from dis_budget for July
    cursor.execute("""
        SELECT COALESCE(SUM(primary_target), 0) as pri_target 
        FROM dis_budget 
        WHERE MONTH(month) = 7 OR month LIKE '%%-07-%%' OR LOWER(month) = 'july';
    """)
    direct_target = cursor.fetchone()['pri_target'] or 0.0

    direct_pct = round((direct_actual / direct_target) * 100) if direct_target > 0 else 0
    direct_variance = direct_actual - direct_target

    print(f"Direct Invoices Net Amount (cust_grp != 'DISTRI' & contract != 'GSTEA'): LKR {dir_inv_net:,.2f}")
    print(f"Direct Outstanding Backlog (cust_grp != 'DISTRI' & contract != 'GSTEA'): LKR {dir_out_back:,.2f}")
    print(f"DIRECT ACTUAL TOTAL:                                                 LKR {direct_actual:,.2f}")
    print(f"DIRECT BUDGET TARGET (dis_budget.primary_target for July):           LKR {direct_target:,.2f}")
    print(f"DIRECT ACHIEVEMENT %:                                                {direct_pct}%")
    print(f"DIRECT VARIANCE:                                                     LKR {direct_variance:,.2f}")

conn.close()
