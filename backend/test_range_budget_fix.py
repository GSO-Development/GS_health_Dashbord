from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Inspecting total_budget & division_mappings for Range 'BL' ===")
    
    cursor.execute("""
        SELECT sales_group, range_name 
        FROM division_mappings 
        WHERE range_name = 'BL';
    """)
    sgs = [r['sales_group'] for r in cursor.fetchall()]
    print("Mapped Sales Groups for 'BL':", sgs)

    cursor.execute("""
        SELECT sales_group, range_name, july, april + may + june + july as cum, total 
        FROM total_budget 
        WHERE sales_group IN (%s);
    """ % (", ".join(["'%s'" % s for s in sgs])))
    rows = cursor.fetchall()
    
    tot_july = 0
    tot_cum = 0
    tot_ann = 0
    for r in rows:
        print(f"  Sales Group: {r['sales_group']} | Range in total_budget: {r['range_name']} | July: {r['july']:,.2f} | Cum: {r['cum']:,.2f} | Total: {r['total']:,.2f}")
        tot_july += float(r['july'] or 0)
        tot_cum += float(r['cum'] or 0)
        tot_ann += float(r['total'] or 0)

    print(f"\nParent Range 'BL' Correct Summed Budget:")
    print(f"  MONTHLY-BUDGET: {tot_july:,.2f}")
    print(f"  CUM-BUDGET:     {tot_cum:,.2f}")
    print(f"  ANNUAL-BUDGET:  {tot_ann:,.2f}")

conn.close()
