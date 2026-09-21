import os
import time
from datetime import datetime
from app.core.database import get_db_connection

# Oracle DB Connection Configuration (READ ONLY STRICT CONNECTIVITY)
ORACLE_HOST = os.getenv("ORACLE_HOST", "172.16.7.45")
ORACLE_PORT = int(os.getenv("ORACLE_PORT", "1521"))
ORACLE_USER = os.getenv("ORACLE_USER", "system")
ORACLE_PASSWORD = os.getenv("ORACLE_PASSWORD", "admin")
ORACLE_SERVICE_NAME = os.getenv("ORACLE_SERVICE_NAME", "XE")
ORACLE_SID = os.getenv("ORACLE_SID", "XE")

# Attempt Oracle Thick Mode initialization if client exists
try:
    import oracledb
    current_dir = os.path.dirname(os.path.abspath(__file__))
    project_root = os.path.abspath(os.path.join(current_dir, "..", ".."))
    local_client = os.path.join(project_root, "instantclient", "instantclient_19_23")

    client_dirs = [
        "/opt/oracle/instantclient_19_23",
        "/opt/oracle/instantclient",
        "/usr/lib/oracle/19.23/client64/lib",
        local_client,
        r"C:\instantclient_19_23",
        r"C:\instantclient_21_13",
        r"C:\instantclient",
        r"C:\oraclexe\app\oracle\product\11.2.0\server\bin"
    ]
    for d in client_dirs:
        if os.path.exists(d):
            try:
                oracledb.init_oracle_client(lib_dir=d)
                break
            except Exception:
                pass
    else:
        try:
            oracledb.init_oracle_client()
        except Exception:
            pass
except Exception:
    pass

sync_status = {
    "last_sync": None,
    "status": "idle",
    "message": "Ready for Read-Only Live Sync with Oracle DB (172.16.7.45:1521/XE)",
    "records_synced": 0,
    "target_ip": ORACLE_HOST,
    "invoice_records": 0,
    "outstanding_records": 0
}

def sync_oracle_invoices(oracle_user: str = None, oracle_password: str = None, year: int = None, month: int = None, start_date: str = None, end_date: str = None):
    """
    STRICT READ-ONLY SYNC FOR INVOICES:
    Fetches invoice_output records from Oracle DB (ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP).
    Supports optional date filtering.
    """
    global sync_status
    user = oracle_user or ORACLE_USER
    pwd = oracle_password or ORACLE_PASSWORD
    inv_rows = []
    
    # Construct optional Oracle WHERE clause
    where_parts = []
    if start_date:
        where_parts.append(f"invoice_date >= TO_DATE('{start_date}', 'YYYY-MM-DD')")
    if end_date:
        where_parts.append(f"invoice_date <= TO_DATE('{end_date}', 'YYYY-MM-DD')")
    elif year and month:
        where_parts.append(f"EXTRACT(YEAR FROM invoice_date) = {int(year)} AND EXTRACT(MONTH FROM invoice_date) = {int(month)}")
    elif year:
        where_parts.append(f"EXTRACT(YEAR FROM invoice_date) = {int(year)}")

    oracle_where = (" WHERE " + " AND ".join(where_parts)) if where_parts else ""

    try:
        import oracledb
        try:
            dsn = oracledb.makedsn(ORACLE_HOST, ORACLE_PORT, sid=ORACLE_SID)
            oracle_conn = oracledb.connect(user=user, password=pwd, dsn=dsn)
        except Exception:
            dsn = f"{ORACLE_HOST}:{ORACLE_PORT}/{ORACLE_SERVICE_NAME}"
            oracle_conn = oracledb.connect(user=user, password=pwd, dsn=dsn)

        with oracle_conn.cursor() as o_cursor:
            o_cursor.execute(f"SELECT * FROM ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP{oracle_where}")
            inv_rows = o_cursor.fetchall()
        oracle_conn.close()

        if inv_rows:
            m_conn = get_db_connection()
            with m_conn.cursor() as cursor:
                if start_date and end_date:
                    cursor.execute("DELETE FROM invoice_output WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s;", (start_date, end_date))
                elif start_date:
                    cursor.execute("DELETE FROM invoice_output WHERE DATE(invoice_date) >= %s;", (start_date,))
                elif year and month:
                    cursor.execute("DELETE FROM invoice_output WHERE YEAR(invoice_date) = %s AND MONTH(invoice_date) = %s;", (year, month))
                elif year:
                    cursor.execute("DELETE FROM invoice_output WHERE YEAR(invoice_date) = %s;", (year,))
                else:
                    cursor.execute("TRUNCATE TABLE invoice_output;")

                inv_sql = """
                    INSERT INTO invoice_output (
                        delivery_customer, delivery_customer_name, invoice_id, series_id, invoice_no,
                        item_id, catalog_no, description, contract, sales_part_rebate_group,
                        invoiced_qty, sale_um, col_13, price_um, calculated_unit_price,
                        invoice_date, net_dom_amount, currency_code, condition_code, condition_code_desc,
                        order_no, agreement_id, cust_grp, catalog_group, region_code,
                        district_code, market_code, country_code, salesman_code, authorize_code,
                        price_list_no, party, party_type, identity, identity_name,
                        price_adjustment, company, price_conv
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                # Filter out any HET0 catalog rows
                filtered_inv = [r for r in inv_rows if not (str(r[6] or '').strip().upper().startswith('HET0'))]
                cursor.executemany(inv_sql, filtered_inv)
                cursor.execute("DELETE FROM invoice_output WHERE TRIM(catalog_no) LIKE 'HET0%' OR catalog_no LIKE '%HET0%';")
            m_conn.close()

    except Exception as e:
        error_msg = f"Oracle Invoice Sync Failed: {str(e)}"
        print(f"❌ {error_msg}")
        sync_status["status"] = "error"
        sync_status["message"] = error_msg
        raise RuntimeError(error_msg)

    # Get current row count of invoice_output
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM invoice_output;")
        cnt = cursor.fetchone()['cnt'] or 0
    conn.close()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    synced_this_run = len(inv_rows)
    sync_status["last_sync"] = now_str
    sync_status["status"] = "success"
    sync_status["invoice_records"] = cnt
    
    if synced_this_run > 0:
        sync_status["message"] = f"Oracle Live Sync Complete! Synced {synced_this_run:,} live invoice records from IFS (Total in DB: {cnt:,})."
    else:
        sync_status["message"] = f"Invoice Sync Complete! Total records in database: {cnt:,}."

    return {
        "status": "success",
        "message": sync_status["message"],
        "records_synced": synced_this_run or cnt,
        "total_records": cnt,
        "last_sync": now_str
    }


def sync_oracle_outstanding(oracle_user: str = None, oracle_password: str = None, year: int = None, month: int = None, start_date: str = None, end_date: str = None):
    """
    STRICT READ-ONLY SYNC FOR OUTSTANDING BACKLOG:
    Fetches outstanding_output records from Oracle DB (ifsapp.gsh_order_report@IFS_PROD_IFSAPP).
    """
    global sync_status
    user = oracle_user or ORACLE_USER
    pwd = oracle_password or ORACLE_PASSWORD
    order_rows = []
    
    # Construct optional Oracle WHERE clause
    where_parts = []
    if start_date:
        where_parts.append(f"planned_delivery_date >= TO_DATE('{start_date}', 'YYYY-MM-DD')")
    if end_date:
        where_parts.append(f"planned_delivery_date <= TO_DATE('{end_date}', 'YYYY-MM-DD')")
    elif year and month:
        where_parts.append(f"EXTRACT(YEAR FROM planned_delivery_date) = {int(year)} AND EXTRACT(MONTH FROM planned_delivery_date) = {int(month)}")
    elif year:
        where_parts.append(f"EXTRACT(YEAR FROM planned_delivery_date) = {int(year)}")

    oracle_where = (" WHERE " + " AND ".join(where_parts)) if where_parts else ""

    try:
        import oracledb
        try:
            dsn = oracledb.makedsn(ORACLE_HOST, ORACLE_PORT, sid=ORACLE_SID)
            oracle_conn = oracledb.connect(user=user, password=pwd, dsn=dsn)
        except Exception:
            dsn = f"{ORACLE_HOST}:{ORACLE_PORT}/{ORACLE_SERVICE_NAME}"
            oracle_conn = oracledb.connect(user=user, password=pwd, dsn=dsn)

        with oracle_conn.cursor() as o_cursor:
            o_cursor.execute(f"SELECT * FROM ifsapp.gsh_order_report@IFS_PROD_IFSAPP{oracle_where}")
            order_rows = o_cursor.fetchall()
        oracle_conn.close()

        if order_rows:
            m_conn = get_db_connection()
            with m_conn.cursor() as cursor:
                if start_date and end_date:
                    cursor.execute("DELETE FROM outstanding_output WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s;", (start_date, end_date))
                elif start_date:
                    cursor.execute("DELETE FROM outstanding_output WHERE DATE(planned_delivery_date) >= %s;", (start_date,))
                elif year and month:
                    cursor.execute("DELETE FROM outstanding_output WHERE YEAR(planned_delivery_date) = %s AND MONTH(planned_delivery_date) = %s;", (year, month))
                elif year:
                    cursor.execute("DELETE FROM outstanding_output WHERE YEAR(planned_delivery_date) = %s;", (year,))
                else:
                    cursor.execute("TRUNCATE TABLE outstanding_output;")

                ord_sql = """
                    INSERT INTO outstanding_output (
                        customer_no, customer_name, order_no, line_no, rel_no,
                        line_state, agreement_id, catalog_no, catalog_desc, condition_code,
                        condition_code_desc, contract, buy_qty_due, sales_unit_meas, calculated_qty,
                        price_unit_meas, calculated_unit_price, planned_delivery_date, backlog_value_base_curr, currency_code,
                        cust_grp, catalog_group, region_code, district_code, market_code,
                        country_code, salesman_code, authorize_code, price_list_no, priority,
                        line_item_no
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
                """
                # Filter out any HET0 catalog rows
                filtered_orders = [r for r in order_rows if not (str(r[7] or '').strip().upper().startswith('HET0'))]
                cursor.executemany(ord_sql, filtered_orders)
                cursor.execute("DELETE FROM outstanding_output WHERE TRIM(catalog_no) LIKE 'HET0%' OR catalog_no LIKE '%HET0%';")
            m_conn.close()

    except Exception as e:
        error_msg = f"Oracle Outstanding Sync Failed: {str(e)}"
        print(f"❌ {error_msg}")
        sync_status["status"] = "error"
        sync_status["message"] = error_msg
        raise RuntimeError(error_msg)

    # Get current row count of outstanding_output
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT COUNT(*) as cnt FROM outstanding_output;")
        cnt = cursor.fetchone()['cnt'] or 0
    conn.close()

    now_str = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    synced_this_run = len(order_rows)
    sync_status["last_sync"] = now_str
    sync_status["status"] = "success"
    sync_status["outstanding_records"] = cnt

    if synced_this_run > 0:
        sync_status["message"] = f"Oracle Live Sync Complete! Synced {synced_this_run:,} live outstanding backlog records from IFS (Total in DB: {cnt:,})."
    else:
        sync_status["message"] = f"Outstanding Sync Complete! Total records in database: {cnt:,}."

    return {
        "status": "success",
        "message": sync_status["message"],
        "records_synced": synced_this_run or cnt,
        "total_records": cnt,
        "last_sync": now_str
    }


def sync_oracle_live(oracle_user: str = None, oracle_password: str = None):
    res_inv = sync_oracle_invoices(oracle_user, oracle_password)
    res_out = sync_oracle_outstanding(oracle_user, oracle_password)
    return {
        "status": "success",
        "message": f"Full Oracle Sync Complete: {res_inv['records_synced']:,} invoices and {res_out['records_synced']:,} outstanding backlog records synced.",
        "invoice_synced": res_inv['records_synced'],
        "outstanding_synced": res_out['records_synced']
    }
