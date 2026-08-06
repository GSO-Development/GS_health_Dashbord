from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Testing All Updated User Formulas for Dashboard FY (July 2026) ===")

    # 1. TOTAL BUDGET vs ACTUAL
    cursor.execute("SELECT COALESCE(SUM(july), 0) as target FROM total_budget;")
    tot_budget = float(cursor.fetchone()['target'] or 0.0)

    cursor.execute("SELECT COALESCE(SUM(net_dom_amount), 0) as inv FROM invoice_output WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026;")
    tot_inv = float(cursor.fetchone()['inv'] or 0.0)

    cursor.execute("SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back FROM outstanding_output WHERE UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL;")
    tot_back = float(cursor.fetchone()['back'] or 0.0)

    tot_actual = tot_inv + tot_back

    print(f"\n1. TOTAL BUDGET vs ACTUAL:")
    print(f"   Target (total_budget July): {tot_budget:,.2f}")
    print(f"   Actual (Invoice + Backlog): {tot_actual:,.2f}")

    # 2. DIS PRI BUDGET vs ACTUAL (ONLY cust_grp = 'DISTRI')
    cursor.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as inv 
        FROM invoice_output 
        WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026
          AND UPPER(TRIM(cust_grp)) = 'DISTRI'
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    dis_pri_inv = float(cursor.fetchone()['inv'] or 0.0)

    cursor.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back 
        FROM outstanding_output 
        WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    dis_pri_back = float(cursor.fetchone()['back'] or 0.0)

    dis_pri_actual = dis_pri_inv + dis_pri_back

    cursor.execute("""
        SELECT COALESCE(SUM(primary_target), 0) as pri_target 
        FROM dis_budget 
        WHERE MONTH(month) = 7 OR month LIKE '%%-07-%%' OR LOWER(month) = 'july';
    """)
    dis_pri_target = float(cursor.fetchone()['pri_target'] or 0.0)

    print(f"\n2. DIS : PRI BUDGET vs ACTUAL:")
    print(f"   Dis Pri Target (dis_budget.primary_target July): LKR {dis_pri_target:,.2f}")
    print(f"   Dis Pri Invoices (cust_grp = 'DISTRI'):          LKR {dis_pri_inv:,.2f}")
    print(f"   Dis Pri Backlog  (cust_grp = 'DISTRI'):          LKR {dis_pri_back:,.2f}")
    print(f"   DIS PRI ACTUAL TOTAL:                           LKR {dis_pri_actual:,.2f}")

    # 3. DIRECT BUDGET vs ACTUAL (Excl cust_grp = 'DISTRI' and contract = 'GSTEA')
    cursor.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as inv 
        FROM invoice_output 
        WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026
          AND (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    dir_inv = float(cursor.fetchone()['inv'] or 0.0)

    cursor.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back 
        FROM outstanding_output 
        WHERE (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    dir_back = float(cursor.fetchone()['back'] or 0.0)

    dir_actual = dir_inv + dir_back
    # Direct Target = Total July Budget minus Dis Primary Target
    dir_target = tot_budget - dis_pri_target

    print(f"\n3. DIRECT BUDGET vs ACTUAL:")
    print(f"   Direct Target (Total July Budget - Dis Pri Target): LKR {dir_target:,.2f}")
    print(f"   Direct Invoices Net (Excl DISTRI & GSTEA):          LKR {dir_inv:,.2f}")
    print(f"   Direct Backlog      (Excl DISTRI & GSTEA):          LKR {dir_back:,.2f}")
    print(f"   DIRECT ACTUAL TOTAL:                                LKR {dir_actual:,.2f}")

    # 4. DIS : RD BUDGET vs ACTUAL (Actual from axienta_data table, Target from dis_budget.rd_target)
    cursor.execute("""
        SELECT COALESCE(SUM(value), 0) as rd_act 
        FROM axienta_data 
        WHERE MONTH(entry_date) = 7 AND YEAR(entry_date) = 2026;
    """)
    dis_rd_actual = float(cursor.fetchone()['rd_act'] or 0.0)

    cursor.execute("""
        SELECT COALESCE(SUM(rd_target), 0) as rd_target 
        FROM dis_budget 
        WHERE MONTH(month) = 7 OR month LIKE '%%-07-%%' OR LOWER(month) = 'july';
    """)
    dis_rd_target = float(cursor.fetchone()['rd_target'] or 0.0)

    print(f"\n4. DIS : RD BUDGET vs ACTUAL:")
    print(f"   Dis RD Target (dis_budget.rd_target July):         LKR {dis_rd_target:,.2f}")
    print(f"   Dis RD Actual (axienta_data.value for July):        LKR {dis_rd_actual:,.2f}")

conn.close()
