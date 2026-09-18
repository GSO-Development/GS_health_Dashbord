"""
Budget Seeder for GS Health Dashboard
Reads 'exsels/Budget 2026-27.xlsx' and populates 'total_budget', 'dis_budget', and 'division_mappings'.
"""
import os
import sys
from datetime import datetime
import pandas as pd
from app.core.database import get_db_connection, init_db

BASE_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), ".."))
EXCEL_PATH = os.path.join(BASE_DIR, "exsels", "Budget 2026-27.xlsx")

if not os.path.exists(EXCEL_PATH):
    EXCEL_PATH = os.path.join(r"d:\new_GS\GS_health_Dashbord\exsels", "Budget 2026-27.xlsx")

def parse_num(val):
    if pd.isna(val) or val is None or str(val).strip() == '':
        return 0.0
    try:
        return float(str(val).replace(',', '').strip())
    except Exception:
        return 0.0

def seed_total_budget(conn):
    if not os.path.exists(EXCEL_PATH):
        print(f"[-] Total Budget file not found at {EXCEL_PATH}")
        return 0

    print(f"[+] Loading Total Budget sheet from {EXCEL_PATH}...")
    df = pd.read_excel(EXCEL_PATH, sheet_name='Total Budget', header=None)
    
    # Row 0 is header: ['S. No.', 'Cost Center', 'Sales Group', 'Range', 'Part No.', 'Product (SKU)', 'Pack', Apr...Mar, Total]
    rows_to_insert = []
    for idx, row in df.iloc[1:].iterrows():
        # Skip empty or header rows
        if (pd.isna(row[1]) and pd.isna(row[2]) and pd.isna(row[5])) or \
           (str(row[2]).strip().lower() in ['sales group', 'sales_group']) or \
           (str(row[1]).strip().lower() in ['cost center', 'cost_center']):
            continue
            
        s_no = int(row[0]) if pd.notna(row[0]) and str(row[0]).isdigit() else None
        cost_center = str(row[1]).strip() if pd.notna(row[1]) else None
        sales_group = str(row[2]).strip() if pd.notna(row[2]) else None
        range_name = str(row[3]).strip() if pd.notna(row[3]) else None
        part_no = str(row[4]).strip() if pd.notna(row[4]) else None
        product_sku = str(row[5]).strip() if pd.notna(row[5]) else None
        pack = str(row[6]).strip() if pd.notna(row[6]) else None
        
        # Monthly values
        april = parse_num(row[7])
        may = parse_num(row[8])
        june = parse_num(row[9])
        july = parse_num(row[10])
        august = parse_num(row[11])
        september = parse_num(row[12])
        october = parse_num(row[13])
        november = parse_num(row[14])
        december = parse_num(row[15])
        january = parse_num(row[16])
        february = parse_num(row[17])
        march = parse_num(row[18])
        total = parse_num(row[19])
        
        rows_to_insert.append((
            s_no, cost_center, sales_group, range_name, part_no, product_sku, pack,
            april, may, june, july, august, september, october, november, december,
            january, february, march, total
        ))

    insert_sql = """
        INSERT INTO total_budget (
            s_no, cost_center, sales_group, range_name, part_no, product_sku, pack,
            april, may, june, july, august, september, october, november, december,
            january, february, march, total
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s
        );
    """
    
    with conn.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE total_budget;")
        batch_size = 500
        for i in range(0, len(rows_to_insert), batch_size):
            cursor.executemany(insert_sql, rows_to_insert[i:i + batch_size])

    print(f"  [OK] Seeded {len(rows_to_insert)} total_budget rows.")
    return len(rows_to_insert)

def seed_dis_budget(conn):
    if not os.path.exists(EXCEL_PATH):
        print(f"[-] Dis Budget file not found at {EXCEL_PATH}")
        return 0

    print(f"[+] Loading Dis Budget sheet from {EXCEL_PATH}...")
    df = pd.read_excel(EXCEL_PATH, sheet_name='Dis Budget')
    
    rows_to_insert = []
    for idx, row in df.iterrows():
        month_val = row.get('Month')
        if pd.isna(month_val):
            continue
            
        month_dt = month_val if isinstance(month_val, datetime) else str(month_val)
        prod_id = str(row.get('Product ID')).strip() if pd.notna(row.get('Product ID')) else None
        prod_name = str(row.get('Product')).strip() if pd.notna(row.get('Product')) else None
        div_name = str(row.get('DIVISION NAME')).strip() if pd.notna(row.get('DIVISION NAME')) else None
        
        pri_target = parse_num(row.get('Primary Target'))
        rd_target = parse_num(row.get('RD Target'))
        qtr = str(row.get('QTR')).strip() if pd.notna(row.get('QTR')) else 'Q1'
        
        rows_to_insert.append((
            'FY 2026/27', month_dt, prod_id, prod_name, div_name,
            pri_target, rd_target, qtr
        ))

    insert_sql = """
        INSERT INTO dis_budget (
            fiscal_year, month, product_id, product, division_name,
            primary_target, rd_target, qtr
        ) VALUES (
            %s, %s, %s, %s, %s,
            %s, %s, %s
        );
    """
    
    with conn.cursor() as cursor:
        cursor.execute("TRUNCATE TABLE dis_budget;")
        batch_size = 500
        for i in range(0, len(rows_to_insert), batch_size):
            cursor.executemany(insert_sql, rows_to_insert[i:i + batch_size])

    print(f"  [OK] Seeded {len(rows_to_insert)} dis_budget rows.")
    return len(rows_to_insert)

def sync_division_mappings_table(conn):
    print("[+] Auto-syncing division_mappings from total_budget...")
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT TRIM(sales_group) as s_grp, TRIM(range_name) as r_name
            FROM total_budget
            WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
              AND range_name IS NOT NULL AND TRIM(range_name) != '';
        """)
        pairs = cursor.fetchall()
        
        for p in pairs:
            cursor.execute("""
                INSERT INTO division_mappings (sales_group, range_name)
                VALUES (%s, %s)
                ON DUPLICATE KEY UPDATE range_name = VALUES(range_name);
            """, (p['s_grp'], p['r_name']))

    print(f"  [OK] Synchronized {len(pairs)} division mappings.")

def main():
    print("==================================================")
    print("    GS Health Dashboard - Budget & Mappings Seeder ")
    print("==================================================")
    init_db()
    conn = get_db_connection()
    try:
        c1 = seed_total_budget(conn)
        c2 = seed_dis_budget(conn)
        sync_division_mappings_table(conn)
        print(f"\n[SUCCESS] Seeded {c1} Total Budget rows, {c2} Dis Budget rows, and updated division mappings.")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
