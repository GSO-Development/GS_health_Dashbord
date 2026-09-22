import io
import re
from typing import Optional
from datetime import datetime, date
from fastapi import APIRouter, Query, File, UploadFile, Form, HTTPException, status, Depends
import pandas as pd
from app.core.database import get_db_connection
from app.core.security import require_admin

router = APIRouter(prefix="/api/reports", tags=["Budget Reports"])

MONTH_NAMES = ["april", "may", "june", "july", "august", "september", "october", "november", "december", "january", "february", "march"]
REQUIRED_TOTAL_COLS = ['range_name', 'sales_group', 'part_no', 'product_sku', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december', 'january', 'february', 'march', 'total']
REQUIRED_DIS_COLS = ['product_id', 'product', 'division_name', 'primary_target', 'rd_target']


@router.get("/total-budget")
def get_total_budget(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    search: Optional[str] = None,
    month: Optional[str] = None,
    year: Optional[str] = None
):
    page_num = int(page) if isinstance(page, (int, str)) and str(page).isdigit() else 1
    limit_num = int(limit) if isinstance(limit, (int, str)) and str(limit).isdigit() else 10
    offset = (page_num - 1) * limit_num

    active_month = month.lower().strip() if month and month.lower().strip() in MONTH_NAMES else "july"

    conn = get_db_connection()
    where_clauses = []
    params = []

    if search:
        where_clauses.append("(cost_center LIKE %s OR sales_group LIKE %s OR range_name LIKE %s OR part_no LIKE %s OR product_sku LIKE %s)")
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    if year and year.strip().lower() not in ["all years", "all"]:
        where_clauses.append("(fiscal_year = %s OR fiscal_year IS NULL)")
        params.append(year.strip())

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with conn.cursor() as cursor:
        month_sums_sql = ", ".join([f"COALESCE(SUM({m}), 0) as {m}_sum" for m in MONTH_NAMES])
        cursor.execute(f"SELECT COUNT(*) as cnt, COALESCE(SUM(total), 0) as grand_total, {month_sums_sql} FROM total_budget{where_sql};", params)
        agg = cursor.fetchone()
        total_count = agg['cnt']
        grand_total = round(agg['grand_total'], 2)

        monthly_totals = {m: round(agg[f"{m}_sum"], 2) for m in MONTH_NAMES}
        working_month_total = monthly_totals.get(active_month, 0.0)

        cursor.execute(f"SELECT * FROM total_budget{where_sql} ORDER BY id ASC LIMIT %s OFFSET %s;", params + [limit_num, offset])
        rows = cursor.fetchall()

    conn.close()

    return {
        "report_title": "Total Budget Report (Annual Budget)",
        "total_count": total_count,
        "grand_total": grand_total,
        "active_month": active_month,
        "working_month_total": working_month_total,
        "monthly_totals": monthly_totals,
        "page": page_num,
        "limit": limit_num,
        "total_pages": (total_count + limit_num - 1) // limit_num if limit_num else 1,
        "rows": rows
    }


# Excel Upload Endpoint for Total Budget
@router.post("/budget/upload-excel", dependencies=[Depends(require_admin)])
async def upload_annual_budget_excel(
    file: UploadFile = File(...),
    fiscal_year: str = Form("FY 2026/27"),
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

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    missing_cols = [c for c in REQUIRED_TOTAL_COLS if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Excel column validation failed! Missing required columns: {', '.join(missing_cols)}. Expected columns: {', '.join(REQUIRED_TOTAL_COLS)}"
        )

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM total_budget WHERE fiscal_year = %s;", (fiscal_year,))
        existing_cnt = cursor.fetchone()['cnt']

        if existing_cnt > 0 and not overwrite:
            conn.close()
            return {
                "exists": True,
                "existing_count": existing_cnt,
                "fiscal_year": fiscal_year,
                "message": f"Budget data for {fiscal_year} already exists in total_budget ({existing_cnt} rows). Do you want to replace/overwrite it?"
            }

        cursor.execute("DELETE FROM total_budget WHERE fiscal_year = %s;", (fiscal_year,))
        conn.commit()

        insert_sql = """
            INSERT INTO total_budget (
                fiscal_year, range_name, sales_group, part_no, product_sku,
                april, may, june, july, august, september, october, november, december, january, february, march, total
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s
            )
        """
        
        insert_data = []
        grand_tot = 0.0

        for _, row in df.iterrows():
            r_name = str(row.get('range_name') or '').strip()
            s_grp = str(row.get('sales_group') or '').strip()
            p_no = str(row.get('part_no') or '').strip()
            p_sku = str(row.get('product_sku') or '').strip()

            april = float(row.get('april') or 0.0)
            may = float(row.get('may') or 0.0)
            june = float(row.get('june') or 0.0)
            july = float(row.get('july') or 0.0)
            august = float(row.get('august') or 0.0)
            september = float(row.get('september') or 0.0)
            october = float(row.get('october') or 0.0)
            november = float(row.get('november') or 0.0)
            december = float(row.get('december') or 0.0)
            january = float(row.get('january') or 0.0)
            february = float(row.get('february') or 0.0)
            march = float(row.get('march') or 0.0)

            tot = float(row.get('total') or (april + may + june + july + august + september + october + november + december + january + february + march))
            grand_tot += tot

            insert_data.append((
                fiscal_year, r_name, s_grp, p_no, p_sku,
                april, may, june, july, august, september, october, november, december, january, february, march, tot
            ))

        cursor.executemany(insert_sql, insert_data)

        cursor.execute("""
            INSERT IGNORE INTO division_mappings (sales_group, range_name)
            SELECT DISTINCT TRIM(sales_group), TRIM(range_name)
            FROM total_budget
            WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';
        """)

        conn.commit()

    conn.close()

    return {
        "success": True,
        "inserted_rows": len(insert_data),
        "grand_total": round(grand_tot, 2),
        "fiscal_year": fiscal_year,
        "message": f"Successfully uploaded and replaced {len(insert_data)} annual budget rows for {fiscal_year}!"
    }


MONTH_MAP = {
    'jan': 1, 'feb': 2, 'mar': 3, 'apr': 4, 'may': 5, 'jun': 6,
    'jul': 7, 'aug': 8, 'sep': 9, 'oct': 10, 'nov': 11, 'dec': 12
}

def parse_dis_budget_month(val):
    if val is None or (isinstance(val, float) and pd.isna(val)):
        return None, '1st QTR'
    
    if isinstance(val, (datetime, pd.Timestamp)):
        m = val.month
        qtr = '1st QTR' if m in [4, 5, 6] else ('2nd QTR' if m in [7, 8, 9] else ('3rd QTR' if m in [10, 11, 12] else '4th QTR'))
        return val.strftime("%Y-%m-01 00:00:00"), qtr
    
    s = str(val).strip()
    if not s or s.lower() == 'nan':
        return None, '1st QTR'
        
    # Match 'Apr-26', 'Apr 26', 'Apr/26'
    m_match = re.match(r'^([A-Za-z]{3})[-/\s]?(\d{2,4})$', s)
    if m_match:
        m_str = m_match.group(1).lower()
        y_str = m_match.group(2)
        year = int(y_str) if len(y_str) == 4 else (2000 + int(y_str))
        month_num = MONTH_MAP.get(m_str, 1)
        qtr = '1st QTR' if month_num in [4, 5, 6] else ('2nd QTR' if month_num in [7, 8, 9] else ('3rd QTR' if month_num in [10, 11, 12] else '4th QTR'))
        return f"{year:04d}-{month_num:02d}-01 00:00:00", qtr
        
    try:
        dt = pd.to_datetime(s)
        if not pd.isna(dt):
            m = dt.month
            qtr = '1st QTR' if m in [4, 5, 6] else ('2nd QTR' if m in [7, 8, 9] else ('3rd QTR' if m in [10, 11, 12] else '4th QTR'))
            return dt.strftime("%Y-%m-01 00:00:00"), qtr
    except Exception:
        pass

    return s, '1st QTR'

# Get Dis Budget Records
@router.get("/dis-budget")
def get_dis_budget(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    search: Optional[str] = None,
    division: Optional[str] = None,
    qtr: Optional[str] = None,
    month_num: Optional[int] = Query(7, ge=1, le=12),
    year: Optional[str] = None
):
    page_num = int(page) if isinstance(page, (int, str)) and str(page).isdigit() else 1
    limit_num = int(limit) if isinstance(limit, (int, str)) and str(limit).isdigit() else 10
    offset = (page_num - 1) * limit_num

    selected_month_num = int(month_num) if month_num and 1 <= int(month_num) <= 12 else 7

    conn = get_db_connection()
    where_clauses = []
    params = []

    if search:
        where_clauses.append("(product_id LIKE %s OR product LIKE %s OR division_name LIKE %s)")
        s = f"%{search}%"
        params.extend([s, s, s])

    if division:
        where_clauses.append("division_name = %s")
        params.append(division)

    if qtr:
        where_clauses.append("qtr = %s")
        params.append(qtr)

    if year and year.strip().lower() not in ["all years", "all"]:
        where_clauses.append("(fiscal_year = %s OR fiscal_year IS NULL)")
        params.append(year.strip())

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with conn.cursor() as cursor:
        cursor.execute(f"""
            SELECT 
                COUNT(*) as cnt, 
                COALESCE(SUM(primary_target), 0) as total_pri_target,
                COALESCE(SUM(rd_target), 0) as total_rd_target
            FROM dis_budget{where_sql};
        """, params)
        agg = cursor.fetchone()
        total_count = agg['cnt']

        wm_where_sql = f"{where_sql} {'AND' if where_sql else 'WHERE'} MONTH(month) = %s"
        cursor.execute(f"""
            SELECT 
                COALESCE(SUM(primary_target), 0) as wm_pri_target,
                COALESCE(SUM(rd_target), 0) as wm_rd_target
            FROM dis_budget{wm_where_sql};
        """, params + [selected_month_num])
        wm_agg = cursor.fetchone()

        cursor.execute(f"SELECT * FROM dis_budget{where_sql} ORDER BY id ASC LIMIT %s OFFSET %s;", params + [limit_num, offset])
        rows = cursor.fetchall()

        for row in rows:
            if row.get("month"):
                m_val = row["month"]
                if isinstance(m_val, (datetime, date)):
                    row["month"] = m_val.strftime("%b-%y")
                else:
                    try:
                        dt = pd.to_datetime(m_val)
                        row["month"] = dt.strftime("%b-%y")
                    except Exception:
                        row["month"] = str(m_val)

    conn.close()

    return {
        "report_title": "Distributor Budget Report (Dis Budget)",
        "total_count": total_count,
        "selected_month_num": selected_month_num,
        "summary": {
            "primary_target": round(agg['total_pri_target'], 2),
            "rd_target": round(agg['total_rd_target'], 2)
        },
        "working_month_summary": {
            "primary_target": round(wm_agg['wm_pri_target'], 2),
            "rd_target": round(wm_agg['wm_rd_target'], 2)
        },
        "page": page_num,
        "limit": limit_num,
        "total_pages": (total_count + limit_num - 1) // limit_num if limit_num else 1,
        "rows": rows
    }


# Excel Upload Endpoint for Dis Budget
@router.post("/dis-budget/upload-excel", dependencies=[Depends(require_admin)])
async def upload_dis_budget_excel(
    file: UploadFile = File(...),
    fiscal_year: str = Form("FY 2026/27"),
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

    df.columns = [str(c).strip().lower().replace(" ", "_") for c in df.columns]

    missing_cols = [c for c in REQUIRED_DIS_COLS if c not in df.columns]
    if missing_cols:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Dis Budget Excel column validation failed! Missing required columns: {', '.join(missing_cols)}. Expected columns: Product ID, Product, DIVISION NAME, Primary Target, RD Target (Optional: Month, QTR)"
        )

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM dis_budget WHERE fiscal_year = %s;", (fiscal_year,))
        existing_cnt = cursor.fetchone()['cnt']

        if existing_cnt > 0 and not overwrite:
            conn.close()
            return {
                "exists": True,
                "existing_count": existing_cnt,
                "fiscal_year": fiscal_year,
                "message": f"Dis Budget data for {fiscal_year} already exists in dis_budget ({existing_cnt} rows). Do you want to replace/overwrite it?"
            }

        cursor.execute("DELETE FROM dis_budget WHERE fiscal_year = %s;", (fiscal_year,))
        conn.commit()

        insert_sql = """
            INSERT INTO dis_budget (
                fiscal_year, month, product_id, product, division_name,
                primary_target, rd_target, qtr
            ) VALUES (
                %s, %s, %s, %s, %s, %s, %s, %s
            )
        """

        insert_data = []
        tot_pri_tar = 0.0
        tot_rd_tar = 0.0

        for _, row in df.iterrows():
            raw_month = row.get('month') if 'month' in df.columns else None
            parsed_month, auto_qtr = parse_dis_budget_month(raw_month)
            
            p_id = str(row.get('product_id') or '').strip()
            p_name = str(row.get('product') or '').strip()
            div_name = str(row.get('division_name') or '').strip()

            pri_tar = float(row.get('primary_target') or 0.0)
            rd_tar = float(row.get('rd_target') or 0.0)
            
            row_qtr = str(row.get('qtr') or '').strip() if 'qtr' in df.columns else ''
            final_qtr = row_qtr if row_qtr and row_qtr.lower() != 'nan' else auto_qtr

            tot_pri_tar += pri_tar
            tot_rd_tar += rd_tar

            insert_data.append((
                fiscal_year, parsed_month, p_id, p_name, div_name,
                pri_tar, rd_tar, final_qtr
            ))

        if insert_data:
            cursor.executemany(insert_sql, insert_data)
            conn.commit()

    conn.close()

    return {
        "success": True,
        "inserted_rows": len(insert_data),
        "total_primary_target": round(tot_pri_tar, 2),
        "total_rd_target": round(tot_rd_tar, 2),
        "fiscal_year": fiscal_year,
        "message": f"Successfully uploaded and replaced {len(insert_data)} Dis Budget rows for {fiscal_year}!"
    }

