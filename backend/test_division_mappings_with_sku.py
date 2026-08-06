from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cursor:
    print("=== Testing Division Mappings with Part No and Product (SKU) ===")

    cursor.execute("""
        SELECT 
            b.id as budget_id,
            COALESCE(m.id, b.id) as id,
            TRIM(b.sales_group) as sales_group,
            TRIM(b.range_name) as range_name,
            TRIM(COALESCE(b.part_no, '')) as part_no,
            TRIM(COALESCE(b.product_sku, '')) as product_sku,
            DATE_FORMAT(COALESCE(m.updated_at, NOW()), '%%Y-%%m-%%d %%H:%%i') as updated_at
        FROM total_budget b
        LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
        LIMIT 10;
    """)
    rows = cursor.fetchall()

    print(f"Retrieved {len(rows)} sample mapping rows:")
    for r in rows:
        print(f"  ID #{r['id']} | SG: '{r['sales_group']}' | Range: '{r['range_name']}' | PartNo: '{r['part_no']}' | SKU: '{r['product_sku']}'")

conn.close()
