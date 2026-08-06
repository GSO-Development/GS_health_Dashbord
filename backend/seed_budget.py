import os
import pandas as pd
import numpy as np
from app.core.database import get_db_connection, ensure_database_exists

EXCEL_PATH = r"d:\new_GS\Dash-borad\exsels\Budget 2026-27.xlsx"

def clean_val(val, default=None):
    if pd.isna(val) or val is None or str(val).strip() == '':
        return default
    try:
        return float(val)
    except (ValueError, TypeError):
        return str(val).strip()

def create_tables(conn):
    with conn.cursor() as cursor:
        cursor.execute("DROP TABLE IF EXISTS total_budget;")
        cursor.execute("""
            CREATE TABLE total_budget (
                id INT AUTO_INCREMENT PRIMARY KEY,
                s_no INT,
                cost_center VARCHAR(100),
                sales_group VARCHAR(100),
                range_name VARCHAR(100),
                part_no VARCHAR(100),
                product_sku VARCHAR(255),
                pack VARCHAR(100),
                april DOUBLE DEFAULT 0,
                may DOUBLE DEFAULT 0,
                june DOUBLE DEFAULT 0,
                july DOUBLE DEFAULT 0,
                august DOUBLE DEFAULT 0,
                september DOUBLE DEFAULT 0,
                october DOUBLE DEFAULT 0,
                november DOUBLE DEFAULT 0,
                december DOUBLE DEFAULT 0,
                january DOUBLE DEFAULT 0,
                february DOUBLE DEFAULT 0,
                march DOUBLE DEFAULT 0,
                total DOUBLE DEFAULT 0,
                INDEX idx_cost_center (cost_center),
                INDEX idx_sales_group (sales_group),
                INDEX idx_product_sku (product_sku)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

        cursor.execute("DROP TABLE IF EXISTS dis_budget;")
        cursor.execute("""
            CREATE TABLE dis_budget (
                id INT AUTO_INCREMENT PRIMARY KEY,
                month DATETIME,
                product_id VARCHAR(100),
                product VARCHAR(255),
                division_name VARCHAR(100),
                primary_target DOUBLE DEFAULT 0,
                primary_actual DOUBLE DEFAULT 0,
                rd_target DOUBLE DEFAULT 0,
                rd_actual DOUBLE DEFAULT 0,
                pri_pct DOUBLE DEFAULT 0,
                rd_pct DOUBLE DEFAULT 0,
                qtr VARCHAR(50),
                INDEX idx_product_id (product_id),
                INDEX idx_division_name (division_name),
                INDEX idx_qtr (qtr)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
        """)

def seed_total_budget(conn):
    print("Reading 'Total Budget' sheet...")
    df = pd.read_excel(EXCEL_PATH, sheet_name='Total Budget', header=1)
    df = df.dropna(how='all')

    rows = []
    for idx, r in df.iterrows():
        s_no = int(r.iloc[0]) if pd.notna(r.iloc[0]) and str(r.iloc[0]).replace('.','',1).isdigit() else None
        cost_center = str(r.iloc[1]).strip() if pd.notna(r.iloc[1]) else None
        sales_group = str(r.iloc[2]).strip() if pd.notna(r.iloc[2]) else None
        range_name = str(r.iloc[3]).strip() if pd.notna(r.iloc[3]) else None
        part_no = str(r.iloc[4]).strip() if pd.notna(r.iloc[4]) else None
        product_sku = str(r.iloc[5]).strip() if pd.notna(r.iloc[5]) else None
        pack = str(r.iloc[6]).strip() if pd.notna(r.iloc[6]) else None

        april = float(r.iloc[7]) if pd.notna(r.iloc[7]) else 0.0
        may = float(r.iloc[8]) if pd.notna(r.iloc[8]) else 0.0
        june = float(r.iloc[9]) if pd.notna(r.iloc[9]) else 0.0
        july = float(r.iloc[10]) if pd.notna(r.iloc[10]) else 0.0
        august = float(r.iloc[11]) if pd.notna(r.iloc[11]) else 0.0
        september = float(r.iloc[12]) if pd.notna(r.iloc[12]) else 0.0
        october = float(r.iloc[13]) if pd.notna(r.iloc[13]) else 0.0
        november = float(r.iloc[14]) if pd.notna(r.iloc[14]) else 0.0
        december = float(r.iloc[15]) if pd.notna(r.iloc[15]) else 0.0
        january = float(r.iloc[16]) if pd.notna(r.iloc[16]) else 0.0
        february = float(r.iloc[17]) if pd.notna(r.iloc[17]) else 0.0
        march = float(r.iloc[18]) if pd.notna(r.iloc[18]) else 0.0
        total = float(r.iloc[19]) if pd.notna(r.iloc[19]) else 0.0

        rows.append((
            s_no, cost_center, sales_group, range_name, part_no, product_sku, pack,
            april, may, june, july, august, september, october, november, december, january, february, march,
            total
        ))

    query = """
        INSERT INTO total_budget (
            s_no, cost_center, sales_group, range_name, part_no, product_sku, pack,
            april, may, june, july, august, september, october, november, december, january, february, march,
            total
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s
        );
    """

    with conn.cursor() as cursor:
        batch_size = 500
        for i in range(0, len(rows), batch_size):
            cursor.executemany(query, rows[i:i + batch_size])

    print(f"Imported {len(rows)} records into 'total_budget'.")
    return len(rows)

def seed_dis_budget(conn):
    print("Reading 'Dis Budget' sheet...")
    df = pd.read_excel(EXCEL_PATH, sheet_name='Dis Budget')
    df = df.dropna(how='all')

    rows = []
    for idx, r in df.iterrows():
        month_val = str(r['Month']) if pd.notna(r['Month']) else None
        product_id = str(r['Product ID']).strip() if pd.notna(r['Product ID']) else None
        product = str(r['Product']).strip() if pd.notna(r['Product']) else None
        division_name = str(r['DIVISION NAME']).strip() if pd.notna(r['DIVISION NAME']) else None
        
        pri_target = float(r['Primary Target']) if pd.notna(r['Primary Target']) else 0.0
        pri_actual = float(r['Primary Actual']) if pd.notna(r['Primary Actual']) else 0.0
        rd_target = float(r['RD Target']) if pd.notna(r['RD Target']) else 0.0
        rd_actual = float(r['RD Actual']) if pd.notna(r['RD Actual']) else 0.0
        
        pri_pct = float(r['Pri-%']) if pd.notna(r['Pri-%']) else 0.0
        rd_pct = float(r['RD-%']) if pd.notna(r['RD-%']) else 0.0
        qtr = str(r['QTR']).strip() if pd.notna(r['QTR']) else None

        rows.append((
            month_val, product_id, product, division_name,
            pri_target, pri_actual, rd_target, rd_actual,
            pri_pct, rd_pct, qtr
        ))

    query = """
        INSERT INTO dis_budget (
            month, product_id, product, division_name,
            primary_target, primary_actual, rd_target, rd_actual,
            pri_pct, rd_pct, qtr
        ) VALUES (
            %s, %s, %s, %s,
            %s, %s, %s, %s,
            %s, %s, %s
        );
    """

    with conn.cursor() as cursor:
        batch_size = 1000
        for i in range(0, len(rows), batch_size):
            cursor.executemany(query, rows[i:i + batch_size])

    print(f"Imported {len(rows)} records into 'dis_budget'.")
    return len(rows)

def main():
    ensure_database_exists()
    conn = get_db_connection()
    try:
        print("Creating budget tables...")
        create_tables(conn)
        c1 = seed_total_budget(conn)
        c2 = seed_dis_budget(conn)
        print(f"Successfully finished seeding! Total records: {c1 + c2}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
