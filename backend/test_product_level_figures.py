from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    # Test CARA sales_group product-level budgets and actuals
    cursor.execute("""
        SELECT 
            b.part_no, b.product_sku,
            b.july as m_budget,
            (b.april + b.may + b.june + b.july) as c_budget,
            b.total as a_budget
        FROM total_budget b
        WHERE b.sales_group = 'CARA';
    """)
    prods = cursor.fetchall()
    print("CARA Products Budget Rows:")
    for p in prods[:5]:
        p_no = p['part_no']
        # Product Actuals from invoice_output
        cursor.execute("""
            SELECT COALESCE(SUM(net_dom_amount), 0) as act
            FROM invoice_output
            WHERE catalog_no = %s AND MONTH(invoice_date) = 7 AND YEAR(invoice_date) = 2026;
        """, (p_no,))
        m_act = cursor.fetchone()['act']

        cursor.execute("""
            SELECT COALESCE(SUM(net_dom_amount), 0) as act
            FROM invoice_output
            WHERE catalog_no = %s AND invoice_date >= '2026-04-01' AND invoice_date <= '2026-07-31';
        """, (p_no,))
        c_act = cursor.fetchone()['act']

        print(f"  Part: {p_no} | {p['product_sku'][:30]}")
        print(f"    Monthly: Budget = {p['m_budget']:,.2f} | Actual = {m_act:,.2f}")
        print(f"    Cum (4M): Budget = {p['c_budget']:,.2f} | Actual = {c_act:,.2f}")
        print(f"    Annual:  Budget = {p['a_budget']:,.2f}")

conn.close()
