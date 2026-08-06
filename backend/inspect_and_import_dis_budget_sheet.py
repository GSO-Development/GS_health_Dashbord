import pandas as pd
import numpy as np
import math
from app.core.database import get_db_connection

excel_path = r"d:\new_GS\Dash-borad\exsels\Budget 2026-27.xlsx"

print(f"Reading Excel file: {excel_path}...")
xl = pd.ExcelFile(excel_path)
sheet_names = xl.sheet_names
print("Sheet Names in Excel:", sheet_names)

second_sheet_name = sheet_names[1]
print(f"\nReading 2nd Sheet: '{second_sheet_name}'...")
df = pd.read_excel(excel_path, sheet_name=second_sheet_name)

print("Original Columns:", df.columns.tolist())
print("Total Rows:", len(df))

# Replace NaN with appropriate defaults
df = df.fillna({
    'Month': '',
    'Product ID': '',
    'Product': '',
    'DIVISION NAME': '',
    'Primary Target': 0.0,
    'Primary Actual': 0.0,
    'RD Target': 0.0,
    'RD Actual': 0.0,
    'QTR': 'Q1'
})

# Normalize Column Names
df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

def safe_float(val):
    if pd.isna(val) or val is None:
        return 0.0
    try:
        f = float(val)
        return 0.0 if math.isnan(f) or math.isinf(f) else f
    except (ValueError, TypeError):
        return 0.0

def safe_str(val):
    if pd.isna(val) or val is None:
        return ''
    return str(val).strip()

conn = get_db_connection()
with conn.cursor() as cursor:
    print("\nTruncating existing rows in dis_budget table...")
    cursor.execute("DELETE FROM dis_budget;")
    conn.commit()

    insert_sql = """
        INSERT INTO dis_budget (
            month, product_id, product, division_name,
            primary_target, primary_actual, rd_target, rd_actual, qtr
        ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
    """

    insert_rows = []
    tot_pri_tar = 0.0
    tot_pri_act = 0.0
    tot_rd_tar = 0.0
    tot_rd_act = 0.0

    for _, row in df.iterrows():
        m_val = safe_str(row.get('month'))
        # If month is timestamp string, format to YYYY-MM-DD
        if '00:00:00' in m_val:
            m_val = m_val.split(' ')[0]

        p_id = safe_str(row.get('product_id'))
        p_name = safe_str(row.get('product'))
        div_name = safe_str(row.get('division_name'))

        pri_tar = safe_float(row.get('primary_target'))
        pri_act = safe_float(row.get('primary_actual'))
        rd_tar = safe_float(row.get('rd_target'))
        rd_act = safe_float(row.get('rd_actual'))
        qtr = safe_str(row.get('qtr')) or 'Q1'

        tot_pri_tar += pri_tar
        tot_pri_act += pri_act
        tot_rd_tar += rd_tar
        tot_rd_act += rd_act

        insert_rows.append((
            m_val, p_id, p_name, div_name,
            pri_tar, pri_act, rd_tar, rd_act, qtr
        ))

    if insert_rows:
        cursor.executemany(insert_sql, insert_rows)
        conn.commit()
        print(f"\n✅ Successfully inserted ALL {len(insert_rows)} records into dis_budget table!")
        print(f"   Total Primary Target: LKR {tot_pri_tar:,.2f}")
        print(f"   Total Primary Actual: LKR {tot_pri_act:,.2f}")
        print(f"   Total RD Target:      LKR {tot_rd_tar:,.2f}")
        print(f"   Total RD Actual:      LKR {tot_rd_act:,.2f}")

conn.close()
