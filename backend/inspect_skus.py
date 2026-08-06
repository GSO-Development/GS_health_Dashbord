from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("""
        SELECT DISTINCT sales_group, part_no, product_sku 
        FROM total_budget 
        WHERE sales_group IN ('CARA', 'INGA', 'ADCOCK', 'ARR G (A)') 
        LIMIT 20;
    """)
    rows = cursor.fetchall()
    print("Sample part_no and product_sku in total_budget:")
    for r in rows:
        print("  ", r)

    cursor.execute("""
        SELECT sales_group, GROUP_CONCAT(DISTINCT part_no SEPARATOR ', ') as parts, GROUP_CONCAT(DISTINCT product_sku SEPARATOR ', ') as skus
        FROM total_budget
        WHERE sales_group IN ('CARA', 'INGA', 'ADCOCK')
        GROUP BY sales_group;
    """)
    grouped = cursor.fetchall()
    print("\nGrouped parts and skus per sales_group:")
    for g in grouped:
        print("  ", g)

conn.close()
