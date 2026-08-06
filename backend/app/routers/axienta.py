import io
import re
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Query, File, UploadFile, Form, HTTPException, status
import pandas as pd
from app.core.database import get_db_connection

router = APIRouter(prefix="/api/axienta", tags=["Axienta Data"])

def parse_axienta_number(val) -> float:
    if val is None or pd.isna(val):
        return 0.0
    s = str(val).strip()
    if not s or s.lower() == 'nan':
        return 0.0
    
    # Handle fraction strings like "-1/0.000" or "5391/0.000"
    if '/' in s:
        s = s.split('/')[0].strip()
    
    # Clean commas and currency symbols
    s = s.replace(',', '').replace('LKR', '').replace('$', '').strip()

    try:
        return float(s)
    except ValueError:
        match = re.search(r'[-+]?\d*\.?\d+', s)
        if match:
            return float(match.group(0))
        return 0.0

@router.get("/calendar-summary")
def get_calendar_summary(
    year: int = Query(2026),
    month: int = Query(7, ge=1, le=12)
):
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT 
                DATE_FORMAT(entry_date, '%%Y-%%m-%%d') as entry_date,
                COUNT(*) as row_count,
                COALESCE(SUM(value), 0) as total_value,
                COALESCE(SUM(qty), 0) as total_qty
            FROM axienta_data
            WHERE YEAR(entry_date) = %s AND MONTH(entry_date) = %s
            GROUP BY entry_date;
        """, (year, month))
        rows = cursor.fetchall()
    conn.close()

    summary_map = {}
    for r in rows:
        summary_map[r['entry_date']] = {
            "row_count": r['row_count'],
            "total_value": round(r['total_value'], 2),
            "total_qty": round(r['total_qty'], 2)
        }

    return {
        "year": year,
        "month": month,
        "summary": summary_map
    }


@router.get("/daily-records")
def get_daily_records(
    entry_date: str = Query(...),
    page: int = Query(1, ge=1),
    limit: int = Query(50, ge=1, le=500)
):
    page_num = int(page) if str(page).isdigit() else 1
    limit_num = int(limit) if str(limit).isdigit() else 50
    offset = (page_num - 1) * limit_num

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(value), 0) as tot_val FROM axienta_data WHERE entry_date = %s;", (entry_date,))
        agg = cursor.fetchone()
        total_count = agg['cnt']
        total_value = round(agg['tot_val'], 2)

        cursor.execute("SELECT * FROM axienta_data WHERE entry_date = %s ORDER BY id ASC LIMIT %s OFFSET %s;", (entry_date, limit_num, offset))
        rows = cursor.fetchall()
        for r in rows:
            if r.get('entry_date'):
                r['entry_date'] = str(r['entry_date'])

    conn.close()

    return {
        "entry_date": entry_date,
        "total_count": total_count,
        "total_value": total_value,
        "page": page_num,
        "limit": limit_num,
        "total_pages": (total_count + limit_num - 1) // limit_num if limit_num else 1,
        "rows": rows
    }


@router.post("/upload-excel")
async def upload_axienta_excel(
    file: UploadFile = File(...),
    entry_date: str = Form(...),
    overwrite: bool = Form(False)
):
    if not (file.filename.endswith(".xlsx") or file.filename.endswith(".xls")):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid file format. Only Excel files (.xlsx, .xls) are allowed."
        )

    try:
        contents = await file.read()
        df = pd.read_excel(io.BytesIO(contents))
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Failed to read Excel file: {str(e)}"
        )

    if df.empty:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Uploaded Excel sheet is empty!"
        )

    # Normalize Excel Column Headers (strip whitespace, lowercase)
    cols = [str(c).strip().lower() for c in df.columns]
    df.columns = cols

    # Smart Flexible Column Detection
    pid_col = None
    prod_col = None
    qty_col = None
    val_col = None

    for c in cols:
        c_clean = c.replace("_", " ").replace("-", " ").strip()
        if not pid_col and any(k in c_clean for k in ['product id', 'prod id', 'part no', 'item code', 'id', 'code']):
            pid_col = c
        elif not prod_col and any(k in c_clean for k in ['product', 'description', 'desc', 'item name', 'item']):
            prod_col = c
        elif not qty_col and any(k in c_clean for k in ['qty', 'quantity', 'units']):
            qty_col = c
        elif not val_col and any(k in c_clean for k in ['value', 'amount', 'val', 'net']):
            val_col = c

    # Fallback to column index if headers are ordered
    if not pid_col and len(cols) >= 1:
        pid_col = cols[0]
    if not prod_col and len(cols) >= 2:
        prod_col = cols[1]
    if not qty_col and len(cols) >= 3:
        qty_col = cols[2]
    if not val_col and len(cols) >= 4:
        val_col = cols[3]

    if not (pid_col and prod_col and qty_col and val_col):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Axienta Excel column validation failed! Expected 4 columns: Product ID, Product, Qty, Value"
        )

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM axienta_data WHERE entry_date = %s;", (entry_date,))
        existing_cnt = cursor.fetchone()['cnt']

        if existing_cnt > 0 and not overwrite:
            conn.close()
            return {
                "exists": True,
                "existing_count": existing_cnt,
                "entry_date": entry_date,
                "message": f"Axienta data for {entry_date} already exists ({existing_cnt} records). Do you want to replace/overwrite it?"
            }

        if existing_cnt > 0 and overwrite:
            cursor.execute("DELETE FROM axienta_data WHERE entry_date = %s;", (entry_date,))
            conn.commit()

        insert_sql = """
            INSERT INTO axienta_data (entry_date, product_id, product, qty, value)
            VALUES (%s, %s, %s, %s, %s)
        """

        insert_data = []
        tot_val = 0.0

        for _, row in df.iterrows():
            p_id = str(row.get(pid_col) or '').strip()
            p_name = str(row.get(prod_col) or '').strip()
            qty = parse_axienta_number(row.get(qty_col))
            val = parse_axienta_number(row.get(val_col))
            tot_val += val

            # Ignore blank rows
            if p_id or p_name or qty != 0 or val != 0:
                insert_data.append((entry_date, p_id, p_name, qty, val))

        if insert_data:
            cursor.executemany(insert_sql, insert_data)
            conn.commit()

    conn.close()

    return {
        "success": True,
        "entry_date": entry_date,
        "inserted_rows": len(insert_data),
        "total_value": round(tot_val, 2),
        "message": f"Successfully uploaded {len(insert_data)} Axienta records for {entry_date} (Total Value: LKR {tot_val:,.2f})!"
    }
