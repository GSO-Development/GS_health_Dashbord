from app.core.database import get_db_connection
import time

conn = get_db_connection()

start_time = time.time()
print("=== Testing DISTRI-Range Tree Query (July 2026) ===")

month_num = 7
year = 2026

with conn.cursor() as cursor:
    # 1. Fetch item-level primary target & rd target from dis_budget for July
    cursor.execute("""
        SELECT 
            TRIM(product_id) as pid,
            COALESCE(SUM(primary_target), 0) as m_pri_tgt,
            COALESCE(SUM(rd_target), 0) as m_rd_tgt
        FROM dis_budget
        WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = 'july'
        GROUP BY TRIM(product_id);
    """, (month_num, f"%-{month_num:02d}-%"))
    dis_budget_m_rows = cursor.fetchall()
    dis_budget_map = {r['pid']: r for r in dis_budget_m_rows}

    # 2. Fetch item-level cumulative primary target & rd target from dis_budget (Apr to July)
    cursor.execute("""
        SELECT 
            TRIM(product_id) as pid,
            COALESCE(SUM(primary_target), 0) as c_pri_tgt,
            COALESCE(SUM(rd_target), 0) as c_rd_tgt
        FROM dis_budget
        WHERE MONTH(month) <= %s
        GROUP BY TRIM(product_id);
    """, (month_num,))
    dis_budget_c_rows = cursor.fetchall()
    dis_budget_c_map = {r['pid']: r for r in dis_budget_c_rows}

    # 3. Fetch item-level RD actual from axienta_data for July
    cursor.execute("""
        SELECT 
            TRIM(product_id) as pid,
            COALESCE(SUM(value), 0) as m_rd_act
        FROM axienta_data
        WHERE MONTH(entry_date) = %s AND YEAR(entry_date) = %s
        GROUP BY TRIM(product_id);
    """, (month_num, year))
    axienta_m_rows = cursor.fetchall()
    axienta_m_map = {r['pid']: r['m_rd_act'] for r in axienta_m_rows}

    # 4. Fetch item-level cumulative RD actual from axienta_data (Apr to July)
    cursor.execute("""
        SELECT 
            TRIM(product_id) as pid,
            COALESCE(SUM(value), 0) as c_rd_act
        FROM axienta_data
        WHERE MONTH(entry_date) <= %s AND YEAR(entry_date) = %s
        GROUP BY TRIM(product_id);
    """, (month_num, year))
    axienta_c_rows = cursor.fetchall()
    axienta_c_map = {r['pid']: r['c_rd_act'] for r in axienta_c_rows}

    # 5. Fetch item-level Primary actual from invoice_output for July
    cursor.execute("""
        SELECT 
            TRIM(catalog_no) as pid,
            COALESCE(SUM(net_dom_amount), 0) as m_inv
        FROM invoice_output
        WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s
          AND UPPER(TRIM(cust_grp)) = 'DISTRI'
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
        GROUP BY TRIM(catalog_no);
    """, (month_num, year))
    inv_m_rows = cursor.fetchall()
    inv_m_map = {r['pid']: r['m_inv'] for r in inv_m_rows}

    # 6. Fetch item-level Primary actual from outstanding_output
    cursor.execute("""
        SELECT 
            TRIM(catalog_no) as pid,
            COALESCE(SUM(backlog_value_base_curr), 0) as back
        FROM outstanding_output
        WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
          AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
        GROUP BY TRIM(catalog_no);
    """)
    back_rows = cursor.fetchall()
    back_map = {r['pid']: r['back'] for r in back_rows}

    # 7. Fetch all distinct items with range_name, sales_group, part_no, product_sku from total_budget
    cursor.execute("""
        SELECT DISTINCT
            TRIM(range_name) as division_name,
            TRIM(sales_group) as subgroup_name,
            TRIM(part_no) as part_no,
            TRIM(product_sku) as product_sku
        FROM total_budget
        WHERE range_name IS NOT NULL AND TRIM(range_name) != ''
          AND sales_group IS NOT NULL AND TRIM(sales_group) != ''
        ORDER BY division_name, subgroup_name, part_no;
    """)
    tb_items = cursor.fetchall()

print(f"Loaded {len(tb_items)} items from total_budget in {time.time() - start_time:.2f} seconds.")
print("\nSample first 5 items with calculated metrics:")
for item in tb_items[:5]:
    pid = item['part_no']
    m_b = dis_budget_map.get(pid, {})
    c_b = dis_budget_c_map.get(pid, {})
    m_pri_tgt = float(m_b.get('m_pri_tgt', 0.0))
    m_rd_tgt = float(m_b.get('m_rd_tgt', 0.0))

    m_pri_act = float(inv_m_map.get(pid, 0.0)) + float(back_map.get(pid, 0.0))
    m_rd_act = float(axienta_m_map.get(pid, 0.0))

    print(f"  [{item['division_name']}] -> [{item['subgroup_name']}] -> {pid} ({item['product_sku']})")
    print(f"     PriTgt: {m_pri_tgt:,.2f} | PriAct: {m_pri_act:,.2f} | RDTgt: {m_rd_tgt:,.2f} | RDAct: {m_rd_act:,.2f}")

conn.close()
