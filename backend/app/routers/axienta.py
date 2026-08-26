import io
import re
import calendar
from typing import Optional
from datetime import datetime
from fastapi import APIRouter, Query, File, UploadFile, Form, HTTPException, status, Body
import pandas as pd
try:
    import pymssql
except ImportError:
    pymssql = None
from app.core.database import get_db_connection

router = APIRouter(prefix="/api/axienta", tags=["Axienta Data"])

MSSQL_SERVER = "172.16.0.21"
MSSQL_USER = "readuser"
MSSQL_PASSWORD = "5tgb%TGB"
MSSQL_DB = "GSH"

MSSQL_QUERY_TEMPLATE = """
SELECT T.Distributor AS DistribuotrName,
       T.DistributorID, T.Region, T.Territory, T.ID, T.SerialNo,
       T.InvDate AS Date,
       DATEPART(yyyy, T.InvDate) AS Year, DATEPART(mm, T.InvDate) AS Month, DATEPART(dd, T.InvDate) AS Day,
       T.Outlet, T.OutletID, T.OutletType, T.OutletGroup, T.ProductGroup, T.SalesRepID,
       T.Agent, T.ASMName, T.Route,
       T.Category1 AS ItemCategory01, T.Category2 AS ItemCategory02,
       T.Category3 AS ItemCategory03, T.Category4 AS ItemCategory04, T.Category5 AS ItemCategory05,
       T.ItemID, T.Item, T.Team, T.Reason, T.SalesOrgName, T.UnitsPerBulk1Pack,
       T.Cases, T.Units, T.TotalUnits, T.FreeCases, T.FreeUnits, T.TotalFreeUnits,
       T.Tonnage, T.Price, T.GrossValue, T.LineDisc, T.AdditionalDisc, T.NetValue,
       T.Discount, T.GroupDiscPart, T.AddiLineDisc, T.AddiGroupDisc, T.CompanyLineDisc,
       T.Town, T.Area, T.BusinessArea, T.TypeTxn, T.LineType, T.OutletBusinessType, T.Type,
       T.AgencyName, T.InvoiceType, T.RepType, T.PaymentMode, T.OrderType, T.SubmittedDate,
       T.FreeTonnage, T.EntryNumber, T.AgentID, T.OutletClass, T.CallID, T.TotalDiscount,
       T.SalesModel, T.InvoiceRefId,
       IIF(O.IsActive = 1, 'Active', 'Inactive') AS OutletStatus
FROM SalesAndReturns_RPT T WITH (NOLOCK)
    INNER JOIN dbo.Outlet O ON O.ID = T.OutletID AND O.BusinessChannelUID = T.BusinessChannelUID
WHERE T.BusinessChannelUID = 3 AND T.InvDate >= '{START_DATE}' AND T.InvDate <= '{END_DATE}';
"""

INSERT_SYNC_SQL = """
INSERT INTO axienta_sales_sync (
    distributor_name, distributor_id, region, territory, txn_id, serial_no, inv_date, inv_year, inv_month, inv_day,
    outlet, outlet_id, outlet_type, outlet_group, product_group, sales_rep_id, agent, asm_name, route,
    category1, category2, category3, category4, category5, item_id, item_name, team, reason, sales_org_name,
    units_per_bulk_pack, cases, units, total_units, free_cases, free_units, total_free_units, tonnage, price,
    gross_value, line_disc, additional_disc, net_value, discount, group_disc_part, addi_line_disc, addi_group_disc,
    company_line_disc, town, area, business_area, type_txn, line_type, outlet_business_type, type, agency_name,
    invoice_type, rep_type, payment_mode, order_type, submitted_date, free_tonnage, entry_number, agent_id,
    outlet_class, call_id, total_discount, sales_model, invoice_ref_id, outlet_status
) VALUES (
    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,
    %s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s
);
"""

INSERT_DATA_SQL = """
INSERT INTO axienta_data (entry_date, product_id, product, qty, value)
VALUES (%s, %s, %s, %s, %s);
"""

def fetch_mssql_rows(start_date: str, end_date: str):
    # Strict validation of date format to prevent SQL injection
    if not (re.match(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$', start_date) and re.match(r'^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$', end_date)):
        raise HTTPException(status_code=400, detail="Invalid date parameters.")

    sql_query = MSSQL_QUERY_TEMPLATE.format(START_DATE=start_date, END_DATE=end_date)

    try:
        ms_conn = pymssql.connect(
            server=MSSQL_SERVER, user=MSSQL_USER, password=MSSQL_PASSWORD,
            database=MSSQL_DB, login_timeout=15
        )
        ms_cursor = ms_conn.cursor(as_dict=True)
        ms_cursor.execute(sql_query)
        rows = ms_cursor.fetchall()
        ms_conn.close()
        return rows
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Failed to connect or fetch from MS SQL Server (172.16.0.21): {str(e)}"
        )

def process_and_save_sync_data(rows, delete_year=None, delete_month=None, delete_date_str=None):
    sync_tuples = []
    data_tuples = []
    for r in rows:
        inv_dt = r.get("Date")
        inv_date_str = inv_dt.strftime("%Y-%m-%d") if isinstance(inv_dt, datetime) else str(inv_dt)[:10] if inv_dt else None
        submitted_dt = r.get("SubmittedDate")

        sync_tuples.append((
            r.get("DistribuotrName"), r.get("DistributorID"), r.get("Region"), r.get("Territory"),
            r.get("ID"), r.get("SerialNo"), inv_dt, r.get("Year"), r.get("Month"), r.get("Day"),
            r.get("Outlet"), r.get("OutletID"), r.get("OutletType"), r.get("OutletGroup"),
            r.get("ProductGroup"), r.get("SalesRepID"), r.get("Agent"), r.get("ASMName"), r.get("Route"),
            r.get("ItemCategory01"), r.get("ItemCategory02"), r.get("ItemCategory03"),
            r.get("ItemCategory04"), r.get("ItemCategory05"), r.get("ItemID"), r.get("Item"),
            r.get("Team"), r.get("Reason"), r.get("SalesOrgName"),
            r.get("UnitsPerBulk1Pack") or 0, r.get("Cases") or 0,
            float(r.get("Units") or 0), float(r.get("TotalUnits") or 0),
            r.get("FreeCases") or 0, float(r.get("FreeUnits") or 0),
            float(r.get("TotalFreeUnits") or 0), float(r.get("Tonnage") or 0),
            float(r.get("Price") or 0), float(r.get("GrossValue") or 0),
            float(r.get("LineDisc") or 0), float(r.get("AdditionalDisc") or 0),
            float(r.get("NetValue") or 0), float(r.get("Discount") or 0),
            float(r.get("GroupDiscPart") or 0), float(r.get("AddiLineDisc") or 0),
            float(r.get("AddiGroupDisc") or 0), float(r.get("CompanyLineDisc") or 0),
            r.get("Town"), r.get("Area"), r.get("BusinessArea"), r.get("TypeTxn"),
            r.get("LineType"), r.get("OutletBusinessType"), r.get("Type"), r.get("AgencyName"),
            r.get("InvoiceType"), r.get("RepType"), r.get("PaymentMode"), r.get("OrderType"),
            submitted_dt, float(r.get("FreeTonnage") or 0), r.get("EntryNumber"), r.get("AgentID"),
            r.get("OutletClass"), r.get("CallID"), float(r.get("TotalDiscount") or 0),
            r.get("SalesModel"), r.get("InvoiceRefId"), r.get("OutletStatus")
        ))

        data_tuples.append((
            inv_date_str,
            r.get("ItemID") or "",
            r.get("Item") or "",
            float(r.get("TotalUnits") or 0),
            float(r.get("NetValue") or 0)
        ))

    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            if delete_date_str:
                # Single day replacement using indexed range
                cursor.execute("DELETE FROM axienta_sales_sync WHERE inv_date >= %s AND inv_date <= %s;", (f"{delete_date_str} 00:00:00", f"{delete_date_str} 23:59:59"))
                cursor.execute("DELETE FROM axienta_data WHERE entry_date = %s;", (delete_date_str,))
            elif delete_year and delete_month:
                # Month-level replacement
                cursor.execute("DELETE FROM axienta_sales_sync WHERE inv_year = %s AND inv_month = %s;", (delete_year, delete_month))
                cursor.execute("DELETE FROM axienta_data WHERE YEAR(entry_date) = %s AND MONTH(entry_date) = %s;", (delete_year, delete_month))

            # Batch insert in chunks of 5000
            chunk_size = 5000
            for i in range(0, len(sync_tuples), chunk_size):
                cursor.executemany(INSERT_SYNC_SQL, sync_tuples[i:i+chunk_size])
                cursor.executemany(INSERT_DATA_SQL, data_tuples[i:i+chunk_size])

        conn.commit()
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database insert error: {str(e)}")
    finally:
        conn.close()

    return len(sync_tuples)

def parse_axienta_number(val) -> float:
    if val is None or pd.isna(val):
        return 0.0
    s = str(val).strip()
    if not s or s.lower() == 'nan':
        return 0.0
    if '/' in s:
        s = s.split('/')[0].strip()
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
                COUNT(*) as sheet_total_count,
                COALESCE(SUM(value), 0) as sheet_total_value,
                COALESCE(SUM(qty), 0) as sheet_total_qty
            FROM axienta_data
            WHERE YEAR(entry_date) = %s AND MONTH(entry_date) = %s
            GROUP BY entry_date
            ORDER BY entry_date ASC;
        """, (year, month))
        rows = cursor.fetchall()
    conn.close()

    summary_map = {}
    prev_count = 0
    prev_val = 0.0

    for r in rows:
        c_count = r['sheet_total_count']
        c_val = float(r['sheet_total_value'])
        
        daily_count = max(c_count - prev_count, 0)
        daily_value = max(c_val - prev_val, 0.0)

        summary_map[r['entry_date']] = {
            "sheet_total_count": c_count,
            "daily_count": daily_count,
            "sheet_total_value": round(c_val, 2),
            "daily_value": round(daily_value, 2),
            "row_count": c_count,
            "total_value": round(c_val, 2)
        }

        prev_count = c_count
        prev_val = c_val

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
    page_num = max(1, page)
    limit_num = max(1, min(limit, 500))
    offset = (page_num - 1) * limit_num

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt, COALESCE(SUM(value), 0) as tot_val FROM axienta_data WHERE entry_date = %s;", (entry_date,))
        agg = cursor.fetchone()
        total_count = agg['cnt']
        total_value = round(float(agg['tot_val']), 2)

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


@router.post("/sync-data")
def sync_axienta_mssql_data(payload: dict = Body(...)):
    """Sync whole month data from MS SQL Server (172.16.0.21 DB: GSH)."""
    year = int(payload.get("year", 2026))
    month = int(payload.get("month", 5))

    start_date = f"{year:04d}-{month:02d}-01 00:00:00"
    last_day = calendar.monthrange(year, month)[1]
    end_date = f"{year:04d}-{month:02d}-{last_day:02d} 23:59:59"

    rows = fetch_mssql_rows(start_date, end_date)
    if not rows:
        return {
            "success": True,
            "message": f"No Axienta records found in MS SQL Server for {year}-{month:02d}",
            "synced_count": 0
        }

    synced_count = process_and_save_sync_data(rows, delete_year=year, delete_month=month)

    return {
        "success": True,
        "message": f"Successfully synced {synced_count:,} Axienta records for {year}-{month:02d}!",
        "synced_count": synced_count
    }


@router.post("/sync-day")
def sync_axienta_single_day(payload: dict = Body(...)):
    """Sync a single specific date from MS SQL Server (172.16.0.21 DB: GSH)."""
    year = int(payload.get("year", 2026))
    month = int(payload.get("month", 5))
    day = int(payload.get("day", 1))

    date_str = f"{year:04d}-{month:02d}-{day:02d}"
    start_date = f"{date_str} 00:00:00"
    end_date = f"{date_str} 23:59:59"

    rows = fetch_mssql_rows(start_date, end_date)
    if not rows:
        return {
            "success": True,
            "message": f"No Axienta records found in MS SQL Server for date {date_str}",
            "synced_count": 0,
            "date": date_str
        }

    synced_count = process_and_save_sync_data(rows, delete_date_str=date_str)

    return {
        "success": True,
        "message": f"Successfully synced {synced_count:,} Axienta records for {date_str}!",
        "synced_count": synced_count,
        "date": date_str
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
        is_xlsx = contents.startswith(b'PK\x03\x04')
        is_xls = contents.startswith(b'\xd0\xcf\x11\xe0\xa1\xb1\x1a\xe1')
        if not (is_xlsx or is_xls):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Security Error: Uploaded file header does not match valid Excel format."
            )
        df = pd.read_excel(io.BytesIO(contents))
    except HTTPException:
        raise
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

    col_map = {str(col).strip().lower(): col for col in df.columns}
    
    prod_id_col = col_map.get('item id') or col_map.get('itemcode') or col_map.get('product id') or col_map.get('itemid')
    prod_col = col_map.get('item') or col_map.get('item description') or col_map.get('product') or col_map.get('product name')
    qty_col = col_map.get('qty') or col_map.get('quantity') or col_map.get('total units') or col_map.get('units')
    val_col = col_map.get('net value') or col_map.get('gross value') or col_map.get('value') or col_map.get('amount')

    if not prod_col or not val_col:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Uploaded sheet must contain at least 'Item' (or Product) and 'Net Value' (or Value) columns. Found columns: {list(df.columns)}"
        )

    records_to_insert = []
    for idx, row in df.iterrows():
        product_name = str(row[prod_col]).strip() if pd.notna(row[prod_col]) else ""
        if not product_name or product_name.lower() == 'nan':
            continue

        prod_id = str(row[prod_id_col]).strip() if prod_id_col and pd.notna(row[prod_id_col]) else ""
        qty_val = parse_axienta_number(row[qty_col]) if qty_col else 0.0
        val_val = parse_axienta_number(row[val_col])

        records_to_insert.append((entry_date, prod_id, product_name, qty_val, val_val))

    if not records_to_insert:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="No valid product records found in uploaded sheet."
        )

    conn = get_db_connection()
    inserted_count = 0
    try:
        with conn.cursor() as cursor:
            if overwrite:
                cursor.execute("DELETE FROM axienta_data WHERE entry_date = %s;", (entry_date,))

            cursor.executemany(
                """
                INSERT INTO axienta_data (entry_date, product_id, product, qty, value)
                VALUES (%s, %s, %s, %s, %s);
                """,
                records_to_insert
            )
            conn.commit()
            inserted_count = len(records_to_insert)
    except Exception as e:
        conn.rollback()
        raise HTTPException(status_code=500, detail=f"Database error saving records: {str(e)}")
    finally:
        conn.close()

    return {
        "success": True,
        "message": f"Successfully uploaded {inserted_count} records for {entry_date}!",
        "count": inserted_count,
        "entry_date": entry_date
    }
