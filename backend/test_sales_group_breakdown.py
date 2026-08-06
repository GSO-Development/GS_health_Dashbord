from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    # 1. Check Sales Groups mapped to AEROMED and DENTAL
    cursor.execute("""
        SELECT sales_group, range_name 
        FROM division_mappings 
        WHERE range_name IN ('AEROMED', 'DENTAL', 'ARROWIL A1')
        ORDER BY range_name, sales_group;
    """)
    rows = cursor.fetchall()
    print("Mapped Sales Groups for sample Ranges:")
    for r in rows:
        print("  ", r)

    # 2. Check total_budget rows for CARA and INGA
    cursor.execute("""
        SELECT sales_group, range_name, april, july, total 
        FROM total_budget 
        WHERE sales_group IN ('CARA', 'INGA', 'PLATINUM S') OR range_name = 'AEROMED';
    """)
    tb_rows = cursor.fetchall()
    print("\ntotal_budget rows for AEROMED sales_groups:")
    for r in tb_rows:
        print("  ", r)

conn.close()
