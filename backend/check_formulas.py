from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("SELECT COUNT(*) as cnt FROM invoice_output;")
    inv_cnt = cursor.fetchone()["cnt"]
    cursor.execute("SELECT COUNT(*) as cnt FROM outstanding_output;")
    out_cnt = cursor.fetchone()["cnt"]
    cursor.execute("SELECT COUNT(*) as cnt FROM total_budget;")
    tb_cnt = cursor.fetchone()["cnt"]
    cursor.execute("SELECT COUNT(*) as cnt FROM dis_budget;")
    db_cnt = cursor.fetchone()["cnt"]
    print("=== MySQL Table Counts ===")
    print(f"invoice_output:     {inv_cnt} rows")
    print(f"outstanding_output: {out_cnt} rows")
    print(f"total_budget:       {tb_cnt} rows")
    print(f"dis_budget:         {db_cnt} rows")

    cursor.execute("SELECT COALESCE(SUM(net_dom_amount),0) as s FROM invoice_output WHERE MONTH(invoice_date)=7 AND YEAR(invoice_date)=2026;")
    jul_inv = float(cursor.fetchone()["s"] or 0)

    cursor.execute("SELECT COALESCE(SUM(net_dom_amount),0) as s FROM invoice_output;")
    all_inv = float(cursor.fetchone()["s"] or 0)

    cursor.execute("SELECT COALESCE(SUM(backlog_value_base_curr),0) as s FROM outstanding_output;")
    backlog = float(cursor.fetchone()["s"] or 0)

    cursor.execute("SELECT COALESCE(SUM(july),0) as s FROM total_budget;")
    jul_target = float(cursor.fetchone()["s"] or 0)

    cursor.execute("SELECT COALESCE(SUM(total),0) as s FROM total_budget;")
    annual_target = float(cursor.fetchone()["s"] or 0)

    print()
    print("=== Dashboard July 2026 Formula Check ===")
    print(f"invoice_output ALL TIME SUM(net_dom_amount):  LKR {all_inv:,.2f}")
    print(f"invoice_output JULY 2026 SUM(net_dom_amount): LKR {jul_inv:,.2f}")
    print(f"outstanding_output SUM(backlog_value_base_curr): LKR {backlog:,.2f}")
    print(f"total_budget SUM(july) TARGET: LKR {jul_target:,.2f}")
    print(f"total_budget SUM(total) ANNUAL TARGET: LKR {annual_target:,.2f}")
    total_actual = jul_inv + backlog
    pct = round((total_actual / 1092090000.0) * 100, 1)
    print(f"Dashboard ACTUAL (inv+backlog): LKR {total_actual:,.2f}")
    print(f"Dashboard PCT vs July target (1,092,090,000): {pct}%")

    print()
    print("=== invoice_output Breakdown by Month/Year ===")
    cursor.execute("""
        SELECT YEAR(invoice_date) as y, MONTH(invoice_date) as m, 
               COUNT(*) as cnt, SUM(net_dom_amount) as total
        FROM invoice_output
        GROUP BY y, m
        ORDER BY y, m;
    """)
    for r in cursor.fetchall():
        y, m, cnt, total = r["y"], r["m"], r["cnt"], float(r["total"] or 0)
        print(f"  {y}-{str(m).zfill(2)}: {cnt} rows  LKR {total:,.2f}")

conn.close()
