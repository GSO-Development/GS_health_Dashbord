from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Testing Exact User Formula: invoice_output.CATALOG_GROUP -> division_mappings.range_name -> invoice_output.NET_DOM_AMOUNT ===")

    # 1. Fetch range mappings
    cursor.execute("""
        SELECT TRIM(sales_group) as sg, TRIM(range_name) as range_name
        FROM division_mappings
        WHERE range_name IS NOT NULL AND TRIM(range_name) != '';
    """)
    mappings = cursor.fetchall()
    
    range_sgs = {}
    for m in mappings:
        rn = m['range_name']
        sg = m['sg']
        if rn not in range_sgs:
            range_sgs[rn] = []
        if sg:
            range_sgs[rn].append(sg)

    sample_ranges = ['ADCOCK', 'AEROMED', 'ALPAYA', 'ALTIVON', 'DENTAL', 'OAKNET']

    for r_name in sample_ranges:
        sgs = range_sgs.get(r_name, [r_name])
        
        # Monthly Actual (July 2026)
        cursor.execute("""
            SELECT COALESCE(SUM(net_dom_amount), 0) as m_act
            FROM invoice_output
            WHERE (catalog_group IN (%s) OR catalog_group = %s)
              AND MONTH(invoice_date) = 7 AND YEAR(invoice_date) = 2026;
        """ % (", ".join(["'%s'" % s for s in sgs]), "'%s'" % r_name))
        m_act = cursor.fetchone()['m_act']

        # Cum Actual (April to July 2026)
        cursor.execute("""
            SELECT COALESCE(SUM(net_dom_amount), 0) as c_act
            FROM invoice_output
            WHERE (catalog_group IN (%s) OR catalog_group = %s)
              AND invoice_date >= '2026-04-01' AND invoice_date <= '2026-07-31';
        """ % (", ".join(["'%s'" % s for s in sgs]), "'%s'" % r_name))
        c_act = cursor.fetchone()['c_act']

        # Annual Actual (Full FY 2026/27)
        cursor.execute("""
            SELECT COALESCE(SUM(net_dom_amount), 0) as a_act
            FROM invoice_output
            WHERE (catalog_group IN (%s) OR catalog_group = %s)
              AND invoice_date >= '2026-04-01' AND invoice_date <= '2027-03-31';
        """ % (", ".join(["'%s'" % s for s in sgs]), "'%s'" % r_name))
        a_act = cursor.fetchone()['a_act']

        print(f"\nRange: {r_name} (Mapped Sales Groups: {sgs})")
        print(f"  MONTHLY-ACTUAL (July 2026): {m_act:,.2f}")
        print(f"  CUM-ACTUAL (Apr-Jul 2026): {c_act:,.2f}")
        print(f"  ANNUAL-ACTUAL (FY 26/27):  {a_act:,.2f}")

conn.close()
