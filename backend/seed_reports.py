import os
import csv
import time
from datetime import datetime
from app.core.database import get_db_connection, init_db, clear_database

CSV_FOLDER = r"d:\new_GS\Dash-borad\exsels"

def parse_float(val):
    if not val:
        return None
    try:
        return float(val.replace(',', '').strip())
    except Exception:
        return None

def parse_date(val):
    if not val:
        return None
    val_str = val.strip()
    for fmt in ('%m/%d/%Y', '%Y-%m-%d %H:%M:%S', '%Y-%m-%d', '%d/%m/%Y', '%m/%d/%Y %H:%M'):
        try:
            return datetime.strptime(val_str, fmt).strftime('%Y-%m-%d %H:%M:%S')
        except Exception:
            pass
    return None

def seed_invoice_output(conn):
    file_path = os.path.join(CSV_FOLDER, "Invoice Output.csv")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return 0

    print(f"Reading '{os.path.basename(file_path)}'...")
    rows = []
    with open(file_path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if not row:
                continue
            if len(row) < 38:
                row = row + [None] * (38 - len(row))
            
            invoiced_qty = parse_float(row[10])
            calculated_unit_price = parse_float(row[14])
            invoice_date = parse_date(row[15])
            net_dom_amount = parse_float(row[16])
            
            processed = (
                row[0] or None, row[1] or None, row[2] or None, row[3] or None, row[4] or None,
                row[5] or None, row[6] or None, row[7] or None, row[8] or None, row[9] or None,
                invoiced_qty, row[11] or None, row[12] or None, row[13] or None, calculated_unit_price,
                invoice_date, net_dom_amount, row[17] or None, row[18] or None, row[19] or None,
                row[20] or None, row[21] or None, row[22] or None, row[23] or None, row[24] or None,
                row[25] or None, row[26] or None, row[27] or None, row[28] or None, row[29] or None,
                row[30] or None, row[31] or None, row[32] or None, row[33] or None, row[34] or None,
                row[35] or None, row[36] or None, row[37] or None
            )
            rows.append(processed)

    query = """
        INSERT INTO invoice_output (
            delivery_customer, delivery_customer_name, invoice_id, series_id, invoice_no,
            item_id, catalog_no, description, contract, sales_part_rebate_group,
            invoiced_qty, sale_um, col_13, price_um, calculated_unit_price,
            invoice_date, net_dom_amount, currency_code, condition_code, condition_code_desc,
            order_no, agreement_id, cust_grp, catalog_group, region_code,
            district_code, market_code, country_code, salesman_code, authorize_code,
            price_list_no, party, party_type, identity, identity_name,
            price_adjustment, company, price_conv
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s
        );
    """

    with conn.cursor() as cursor:
        batch_size = 2000
        for i in range(0, len(rows), batch_size):
            cursor.executemany(query, rows[i:i + batch_size])

    print(f"Imported {len(rows)} records into 'invoice_output'.")
    return len(rows)

def seed_outstanding_output(conn):
    file_path = os.path.join(CSV_FOLDER, "Outstanding Output.csv")
    if not os.path.exists(file_path):
        print(f"File not found: {file_path}")
        return 0

    print(f"Reading '{os.path.basename(file_path)}'...")
    rows = []
    with open(file_path, 'r', encoding='utf-8-sig', errors='replace') as f:
        reader = csv.reader(f)
        header = next(reader)
        for row in reader:
            if not row:
                continue
            if len(row) < 31:
                row = row + [None] * (31 - len(row))
            
            buy_qty_due = parse_float(row[11])
            calculated_qty = parse_float(row[13])
            calculated_unit_price = parse_float(row[15])
            planned_delivery_date = parse_date(row[16])
            backlog_value_base_curr = parse_float(row[17])
            
            processed = (
                row[0] or None, row[1] or None, row[2] or None, row[3] or None, row[4] or None,
                row[5] or None, row[6] or None, row[7] or None, row[8] or None, row[9] or None,
                row[10] or None, buy_qty_due, row[12] or None, calculated_qty, row[14] or None,
                calculated_unit_price, planned_delivery_date, backlog_value_base_curr, row[18] or None, row[19] or None,
                row[20] or None, row[21] or None, row[22] or None, row[23] or None, row[24] or None,
                row[25] or None, row[26] or None, row[27] or None, row[28] or None, row[29] or None,
                row[30] or None
            )
            rows.append(processed)

    query = """
        INSERT INTO outstanding_output (
            customer_no, customer_name, order_no, line_no, rel_no,
            line_state, agreement_id, catalog_no, catalog_desc, condition_code,
            condition_code_desc, buy_qty_due, sales_unit_meas, calculated_qty, price_unit_meas,
            calculated_unit_price, planned_delivery_date, backlog_value_base_curr, currency_code, cust_grp,
            catalog_group, region_code, district_code, market_code, country_code,
            salesman_code, authorize_code, price_list_no, priority, line_item_no,
            contract
        ) VALUES (
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s, %s, %s, %s, %s, %s, %s, %s, %s, %s,
            %s
        );
    """

    with conn.cursor() as cursor:
        batch_size = 1000
        for i in range(0, len(rows), batch_size):
            cursor.executemany(query, rows[i:i + batch_size])

    print(f"Imported {len(rows)} records into 'outstanding_output'.")
    return len(rows)

def main():
    init_db()
    conn = get_db_connection()
    try:
        clear_database(conn)
        c1 = seed_invoice_output(conn)
        c2 = seed_outstanding_output(conn)
        print(f"Finished seeding reports! Total imported records: {c1 + c2}")
    finally:
        conn.close()

if __name__ == "__main__":
    main()
