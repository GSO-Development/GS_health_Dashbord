from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Testing Dis Dashboard FY Backend Overview (July 2026) ===")

    month_num = 7
    year = 2026

    # 1. Primary Sales Details
    cursor.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as inv 
        FROM invoice_output 
        WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s
          AND UPPER(TRIM(cust_grp)) = 'DISTRI'
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """, (month_num, year))
    pri_inv = float(cursor.fetchone()['inv'] or 0.0)

    cursor.execute("""
        SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back 
        FROM outstanding_output 
        WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
    """)
    pri_back = float(cursor.fetchone()['back'] or 0.0)

    pri_act = pri_inv + pri_back

    cursor.execute("""
        SELECT COALESCE(SUM(primary_target), 0) as tgt 
        FROM dis_budget 
        WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = 'july';
    """, (month_num, f"%-{month_num:02d}-%"))
    pri_tgt = float(cursor.fetchone()['tgt'] or 0.0)

    pri_pct = round((pri_act / pri_tgt) * 100) if pri_tgt > 0 else 0
    pri_var = pri_act - pri_tgt

    # 2. RD Sales Details
    cursor.execute("""
        SELECT COALESCE(SUM(value), 0) as val 
        FROM axienta_data 
        WHERE MONTH(entry_date) = %s AND YEAR(entry_date) = %s;
    """, (month_num, year))
    rd_act = float(cursor.fetchone()['val'] or 0.0)

    cursor.execute("""
        SELECT COALESCE(SUM(rd_target), 0) as tgt 
        FROM dis_budget 
        WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = 'july';
    """, (month_num, f"%-{month_num:02d}-%"))
    rd_tgt = float(cursor.fetchone()['tgt'] or 0.0)

    rd_pct = round((rd_act / rd_tgt) * 100) if rd_tgt > 0 else 0
    rd_var = rd_act - rd_tgt

    # 3. Full Year Totals
    cursor.execute("SELECT COALESCE(SUM(primary_target), 0) as fy_pri_tgt, COALESCE(SUM(rd_target), 0) as fy_rd_tgt FROM dis_budget;")
    fy_dis = cursor.fetchone()
    fy_pri_tgt = float(fy_dis['fy_pri_tgt'] or 0.0)
    fy_rd_tgt = float(fy_dis['fy_rd_tgt'] or 0.0)

    cursor.execute("SELECT COALESCE(SUM(value), 0) as fy_rd_act FROM axienta_data;")
    fy_rd_act = float(cursor.fetchone()['fy_rd_act'] or 0.0)

    print("Primary Sales Details:")
    print(f"  Pri:Act (Invoice + Backlog): LKR {pri_act:,.2f}")
    print(f"  Pri:Tgt (dis_budget July):   LKR {pri_tgt:,.2f}")
    print(f"  Pri Pct:                     {pri_pct}%")
    print(f"  Pri Variance:                LKR {pri_var:,.2f}")

    print("\nRD Sales Details:")
    print(f"  RD:Act (axienta_data July):  LKR {rd_act:,.2f}")
    print(f"  RD:Tgt (dis_budget July):    LKR {rd_tgt:,.2f}")
    print(f"  RD Pct:                      {rd_pct}%")
    print(f"  RD Variance:                 LKR {rd_var:,.2f}")

    print("\nFull Year Totals:")
    print(f"  FY Pri Target:               LKR {fy_pri_tgt:,.2f}")
    print(f"  FY RD Target:                LKR {fy_rd_tgt:,.2f}")
    print(f"  FY RD Actual:                LKR {fy_rd_act:,.2f}")

conn.close()
