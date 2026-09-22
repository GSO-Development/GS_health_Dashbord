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

def sync_oracle_invoices(oracle_user: str = None, oracle_password: str = None, year: int = None, month: int = None, start_date: str = None, end_date: str = None, contract: str = None):
    """
    STRICT READ-ONLY SYNC FOR INVOICES:
    Fetches invoice_output records from Oracle DB (ifsapp.gsh_invoice_report@IFS_PROD_IFSAPP).
    Supports optional date/month/year/contract filtering.
    Guarantees no duplicate records by cleaning the targeted partition and using ON DUPLICATE KEY UPDATE.
    """
    global sync_status
    user = oracle_user or ORACLE_USER
    pwd = oracle_password or ORACLE_PASSWORD
    inv_rows = []
    
    # Construct optional Oracle WHERE clause & MySQL DELETE condition
    where_parts = []
    del_parts = []
    del_params = []

    if start_date and end_date:
        where_parts.append(f"invoice_date >= TO_DATE('{start_date}', 'YYYY-MM-DD') AND invoice_date <= TO_DATE('{end_date} 23:59:59', 'YYYY-MM-DD HH24:MI:SS')")
        del_parts.append("DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s")
        del_params.extend([start_date, end_date])
    elif start_date:
        where_parts.append(f"invoice_date >= TO_DATE('{start_date}', 'YYYY-MM-DD')")
        del_parts.append("DATE(invoice_date) >= %s")
        del_params.append(start_date)
    elif end_date:
        where_parts.append(f"invoice_date <= TO_DATE('{end_date} 23:59:59', 'YYYY-MM-DD HH24:MI:SS')")
        del_parts.append("DATE(invoice_date) <= %s")
        del_params.append(end_date)
    elif year and month:
        where_parts.append(f"EXTRACT(YEAR FROM invoice_date) = {int(year)} AND EXTRACT(MONTH FROM invoice_date) = {int(month)}")
        del_parts.append("YEAR(invoice_date) = %s AND MONTH(invoice_date) = %s")
        del_params.extend([int(year), int(month)])
    elif year:
        where_parts.append(f"EXTRACT(YEAR FROM invoice_date) = {int(year)}")
        del_parts.append("YEAR(invoice_date) = %s")
        del_params.append(int(year))
    elif month:
        now_year = datetime.now().year
        where_parts.append(f"EXTRACT(YEAR FROM invoice_date) = {now_year} AND EXTRACT(MONTH FROM invoice_date) = {int(month)}")
        del_parts.append("YEAR(invoice_date) = %s AND MONTH(invoice_date) = %s")
        del_params.extend([now_year, int(month)])

    if contract and str(contract).strip():
        c_clean = str(contract).strip().upper().replace("'", "''")
        where_parts.append(f"UPPER(TRIM(contract)) = '{c_clean}'")
        del_parts.append("UPPER(TRIM(contract)) = %s")
        del_params.append(str(contract).strip().upper())

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

        m_conn = get_db_connection()
        with m_conn.cursor() as cursor:
            # Clean matching partition first so old/cancelled records are removed cleanly
            if del_parts:
                del_sql = f"DELETE FROM invoice_output WHERE {' AND '.join(del_parts)};"
                cursor.execute(del_sql, tuple(del_params))
            else:
                cursor.execute("TRUNCATE TABLE invoice_output;")

            if inv_rows:
                # Deduplicate rows in memory by (invoice_no, item_id, contract) to ensure no internal Oracle duplicates
                seen_keys = set()
                unique_inv_rows = []
                for r in inv_rows:
                    # r[4]=invoice_no, r[5]=item_id, r[8]=contract
                    key = (str(r[4] or '').strip(), str(r[5] or '').strip(), str(r[8] or '').strip().upper())
                    if key not in seen_keys:
                        seen_keys.add(key)
                        unique_inv_rows.append(r)

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
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    ON DUPLICATE KEY UPDATE
                        delivery_customer=VALUES(delivery_customer),
                        delivery_customer_name=VALUES(delivery_customer_name),
                        invoice_id=VALUES(invoice_id),
                        series_id=VALUES(series_id),
                        catalog_no=VALUES(catalog_no),
                        description=VALUES(description),
                        sales_part_rebate_group=VALUES(sales_part_rebate_group),
                        invoiced_qty=VALUES(invoiced_qty),
                        sale_um=VALUES(sale_um),
                        col_13=VALUES(col_13),
                        price_um=VALUES(price_um),
                        calculated_unit_price=VALUES(calculated_unit_price),
                        invoice_date=VALUES(invoice_date),
                        net_dom_amount=VALUES(net_dom_amount),
                        currency_code=VALUES(currency_code),
                        condition_code=VALUES(condition_code),
                        condition_code_desc=VALUES(condition_code_desc),
                        order_no=VALUES(order_no),
                        agreement_id=VALUES(agreement_id),
                        cust_grp=VALUES(cust_grp),
                        catalog_group=VALUES(catalog_group),
                        region_code=VALUES(region_code),
                        district_code=VALUES(district_code),
                        market_code=VALUES(market_code),
                        country_code=VALUES(country_code),
                        salesman_code=VALUES(salesman_code),
                        authorize_code=VALUES(authorize_code),
                        price_list_no=VALUES(price_list_no),
                        party=VALUES(party),
                        party_type=VALUES(party_type),
                        identity=VALUES(identity),
                        identity_name=VALUES(identity_name),
                        price_adjustment=VALUES(price_adjustment),
                        company=VALUES(company),
                        price_conv=VALUES(price_conv);
                """
                cursor.executemany(inv_sql, unique_inv_rows)
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
    sync_status["last_sync"] = now_str
    sync_status["status"] = "success"
    sync_status["records_synced"] = len(inv_rows)
    sync_status["invoice_records"] = cnt
    sync_status["message"] = f"Successfully synced {len(inv_rows):,} invoice records directly from Oracle DB! Total rows: {cnt:,}"

    return {
        "status": "success",
        "message": sync_status["message"],
        "records_synced": len(inv_rows),
        "total_invoices": cnt,
        "timestamp": now_str
    }


def sync_oracle_outstanding(oracle_user: str = None, oracle_password: str = None, year: int = None, month: int = None, start_date: str = None, end_date: str = None, contract: str = None):
    """
    STRICT READ-ONLY SYNC FOR OUTSTANDING:
    Fetches outstanding_output records from Oracle DB (ifsapp.gsh_outstanding_orders_rep@IFS_PROD_IFSAPP).
    Supports optional date filtering and contract filtering.
    """
    global sync_status
    user = oracle_user or ORACLE_USER
    pwd = oracle_password or ORACLE_PASSWORD
    order_rows = []
    
    # Construct optional Oracle WHERE clause & MySQL DELETE clause
    where_parts = []
    del_parts = []
    del_params = []

    if start_date and end_date:
        where_parts.append(f"planned_delivery_date >= TO_DATE('{start_date}', 'YYYY-MM-DD') AND planned_delivery_date <= TO_DATE('{end_date} 23:59:59', 'YYYY-MM-DD HH24:MI:SS')")
        del_parts.append("DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s")
        del_params.extend([start_date, end_date])
    elif start_date:
        where_parts.append(f"planned_delivery_date >= TO_DATE('{start_date}', 'YYYY-MM-DD')")
        del_parts.append("DATE(planned_delivery_date) >= %s")
        del_params.append(start_date)
    elif end_date:
        where_parts.append(f"planned_delivery_date <= TO_DATE('{end_date} 23:59:59', 'YYYY-MM-DD HH24:MI:SS')")
        del_parts.append("DATE(planned_delivery_date) <= %s")
        del_params.append(end_date)
    elif year and month:
        where_parts.append(f"EXTRACT(YEAR FROM planned_delivery_date) = {int(year)} AND EXTRACT(MONTH FROM planned_delivery_date) = {int(month)}")
        del_parts.append("YEAR(planned_delivery_date) = %s AND MONTH(planned_delivery_date) = %s")
        del_params.extend([int(year), int(month)])
    elif year:
        where_parts.append(f"EXTRACT(YEAR FROM planned_delivery_date) = {int(year)}")
        del_parts.append("YEAR(planned_delivery_date) = %s")
        del_params.append(int(year))
    elif month:
        now_year = datetime.now().year
        where_parts.append(f"EXTRACT(YEAR FROM planned_delivery_date) = {now_year} AND EXTRACT(MONTH FROM planned_delivery_date) = {int(month)}")
        del_parts.append("YEAR(planned_delivery_date) = %s AND MONTH(planned_delivery_date) = %s")
        del_params.extend([now_year, int(month)])

    if contract and str(contract).strip():
        c_clean = str(contract).strip().upper().replace("'", "''")
        where_parts.append(f"UPPER(TRIM(contract)) = '{c_clean}'")
        del_parts.append("UPPER(TRIM(contract)) = %s")
        del_params.append(str(contract).strip().upper())

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

        m_conn = get_db_connection()
        with m_conn.cursor() as cursor:
            if del_parts:
                del_sql = f"DELETE FROM outstanding_output WHERE {' AND '.join(del_parts)};"
                cursor.execute(del_sql, tuple(del_params))
            else:
                cursor.execute("TRUNCATE TABLE outstanding_output;")

            if order_rows:
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
                cursor.executemany(ord_sql, order_rows)
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
