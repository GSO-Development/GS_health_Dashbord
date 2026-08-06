from typing import Optional, List
from decimal import Decimal
from datetime import date, datetime
from fastapi import APIRouter, HTTPException, Query, Body
from app.core.database import get_db_connection

router = APIRouter(prefix="/api/prode-ifs", tags=["prode_ifs"])

def sanitize_record(r: dict) -> dict:
    """Helper to convert Decimal, Date, and non-serializable PyMySQL fields into JSON primitive types."""
    clean = {}
    for k, v in r.items():
        if isinstance(v, Decimal):
            clean[k] = float(v)
        elif isinstance(v, (date, datetime)):
            clean[k] = str(v)
        elif isinstance(v, bytes):
            clean[k] = v.decode('utf-8', errors='ignore')
        else:
            clean[k] = v
    return clean

@router.get("/tables")
def get_prode_ifs_tables(
    page1: int = Query(1, ge=1),
    limit1: int = Query(10, ge=1, le=100),
    page2: int = Query(1, ge=1),
    limit2: int = Query(10, ge=1, le=100),
    search: Optional[str] = Query(None)
):
    offset1 = (page1 - 1) * limit1
    offset2 = (page2 - 1) * limit2

    conn = get_db_connection()
    
    where1 = []
    params1 = []
    where2 = []
    params2 = []

    if search and search.strip():
        s = f"%{search.strip()}%"
        where1.append("(i.invoice_no LIKE %s OR i.order_no LIKE %s OR i.delivery_customer_name LIKE %s OR i.catalog_no LIKE %s OR i.catalog_group LIKE %s)")
        params1.extend([s, s, s, s, s])

        where2.append("(o.order_no LIKE %s OR o.customer_no LIKE %s OR o.customer_name LIKE %s OR o.catalog_no LIKE %s OR o.catalog_desc LIKE %s)")
        params2.extend([s, s, s, s, s])

    where_sql1 = (" WHERE " + " AND ".join(where1)) if where1 else ""
    where_sql2 = (" WHERE " + " AND ".join(where2)) if where2 else ""

    with conn.cursor() as cursor:
        # Table 1: Invoice Output + Sales Group & Range Mapping (40 columns)
        cursor.execute(f"SELECT COUNT(i.id) as cnt FROM invoice_output i{where_sql1};", params1)
        cnt1 = cursor.fetchone()["cnt"]

        cursor.execute(f"""
            SELECT 
                i.*,
                COALESCE(m.sales_group, i.catalog_group, i.cust_grp) as sales_group,
                COALESCE(m.range_name, i.catalog_group, i.sales_part_rebate_group) as range_name
            FROM invoice_output i
            LEFT JOIN division_mappings m ON i.catalog_group = m.sales_group
            {where_sql1}
            ORDER BY i.id ASC
            LIMIT %s OFFSET %s;
        """, params1 + [limit1, offset1])
        raw_table1 = cursor.fetchall()
        table1_rows = [sanitize_record(r) for r in raw_table1]

        # Table 2: Outstanding Output (31 columns)
        cursor.execute(f"SELECT COUNT(o.id) as cnt FROM outstanding_output o{where_sql2};", params2)
        cnt2 = cursor.fetchone()["cnt"]

        cursor.execute(f"""
            SELECT o.*
            FROM outstanding_output o
            {where_sql2}
            ORDER BY o.id ASC
            LIMIT %s OFFSET %s;
        """, params2 + [limit2, offset2])
        raw_table2 = cursor.fetchall()
        table2_rows = [sanitize_record(r) for r in raw_table2]

    conn.close()

    return {
        "status": "success",
        "table1": {
            "title": "1. Invoice Output Report Data (+ Sales Group & Range Mapping)",
            "total_count": cnt1,
            "page": page1,
            "limit": limit1,
            "total_pages": (cnt1 + limit1 - 1) // limit1 if limit1 else 1,
            "rows": table1_rows
        },
        "table2": {
            "title": "2. Outstanding Output Report Data",
            "total_count": cnt2,
            "page": page2,
            "limit": limit2,
            "total_pages": (cnt2 + limit2 - 1) // limit2 if limit2 else 1,
            "rows": table2_rows
        }
    }
