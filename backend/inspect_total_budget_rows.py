from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    cursor.execute("SELECT * FROM total_budget WHERE range_name IN ('ADCOCK', 'AEROMED', 'ALPAYA', 'ALTIVON') OR sales_group IN ('ADCOCK', 'AEROMED', 'ALPAYA', 'ALTIVON') LIMIT 20;")
    rows = cursor.fetchall()
    print("Exact total_budget rows for ADCOCK, AEROMED, ALPAYA, ALTIVON:")
    for r in rows:
        print("  range_name:", r.get('range_name'), "| sales_group:", r.get('sales_group'), "| april:", r.get('april'), "| july:", r.get('july'), "| total:", r.get('total'))

    print("\n--- Sum check for ADCOCK ---")
    cursor.execute("SELECT SUM(april) as apr, SUM(july) as jul, SUM(total) as tot FROM total_budget WHERE range_name = 'ADCOCK' OR sales_group = 'ADCOCK';")
    print("  ADCOCK sum:", cursor.fetchone())

    print("\n--- Sum check for AEROMED ---")
    cursor.execute("SELECT SUM(april) as apr, SUM(july) as jul, SUM(total) as tot FROM total_budget WHERE range_name = 'AEROMED' OR sales_group = 'AEROMED';")
    print("  AEROMED sum:", cursor.fetchone())

conn.close()
