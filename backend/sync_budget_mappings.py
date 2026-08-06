from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    # 1. Unique (sales_group, range_name) in total_budget
    cursor.execute("""
        SELECT DISTINCT TRIM(sales_group) as sales_group, TRIM(range_name) as range_name 
        FROM total_budget 
        WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';
    """)
    tb_pairs = cursor.fetchall()
    print(f"Total Unique Sales Group entries in total_budget: {len(tb_pairs)}")
    for p in tb_pairs[:10]:
        print("  total_budget pair:", p)

    # 2. Existing entries in division_mappings
    cursor.execute("SELECT id, sales_group, range_name FROM division_mappings;")
    dm_rows = cursor.fetchall()
    print(f"\nTotal existing rows in division_mappings: {len(dm_rows)}")
    for r in dm_rows[:10]:
        print("  division_mappings row:", r)

    # 3. Check mapped vs unmapped in total_budget
    cursor.execute("""
        SELECT 
            COUNT(DISTINCT b.sales_group) as total_sg,
            COUNT(DISTINCT CASE WHEN m.sales_group IS NOT NULL THEN b.sales_group END) as mapped_sg,
            COUNT(DISTINCT CASE WHEN m.sales_group IS NULL THEN b.sales_group END) as unmapped_sg
        FROM total_budget b
        LEFT JOIN division_mappings m ON TRIM(b.sales_group) = TRIM(m.sales_group);
    """)
    stats = cursor.fetchone()
    print(f"\nMapping Stats in total_budget:")
    print(f"  Total Unique Sales Groups: {stats['total_sg']}")
    print(f"  Mapped Sales Groups:       {stats['mapped_sg']}")
    print(f"  Unmapped Sales Groups:     {stats['unmapped_sg']}")

conn.close()
