import os
import pymysql
import pymysql.cursors

# Environment variables with fallback for XAMPP MySQL defaults
MYSQL_HOST = os.getenv("MYSQL_HOST", "localhost")
MYSQL_PORT = int(os.getenv("MYSQL_PORT", "3306"))
MYSQL_USER = os.getenv("MYSQL_USER", "root")
MYSQL_PASSWORD = os.getenv("MYSQL_PASSWORD", "")
MYSQL_DB = os.getenv("MYSQL_DB", "gsh_dashboard")

def ensure_database_exists():
    """Create the gsh_dashboard MySQL database if it does not exist."""
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        autocommit=True
    )
    try:
        with conn.cursor() as cursor:
            cursor.execute(f"CREATE DATABASE IF NOT EXISTS `{MYSQL_DB}` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;")
    finally:
        conn.close()

def get_db_connection():
    """Return a pymysql connection to gsh_dashboard database returning dict rows."""
    ensure_database_exists()
    conn = pymysql.connect(
        host=MYSQL_HOST,
        port=MYSQL_PORT,
        user=MYSQL_USER,
        password=MYSQL_PASSWORD,
        database=MYSQL_DB,
        cursorclass=pymysql.cursors.DictCursor,
        autocommit=True
    )
    return conn

def init_db():
    ensure_database_exists()
    conn = get_db_connection()
    try:
        with conn.cursor() as cursor:
            # Drop legacy tables
            cursor.execute("DROP TABLE IF EXISTS customer_invoice_lines;")
            cursor.execute("DROP TABLE IF EXISTS invoiced_sales;")
            cursor.execute("DROP TABLE IF EXISTS outstanding_orders;")
            cursor.execute("DROP TABLE IF EXISTS reserved_sales_summary;")
            cursor.execute("DROP TABLE IF EXISTS division_sales;")
            cursor.execute("DROP TABLE IF EXISTS direct_sales_accounts;")
            cursor.execute("DROP TABLE IF EXISTS distributor_sales;")
            cursor.execute("DROP TABLE IF EXISTS monthly_cumulative_sales;")

            # 1. Table for Invoice Output
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS invoice_output (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    delivery_customer VARCHAR(100),
                    delivery_customer_name VARCHAR(255),
                    invoice_id VARCHAR(100),
                    series_id VARCHAR(50),
                    invoice_no VARCHAR(100),
                    item_id VARCHAR(50),
                    catalog_no VARCHAR(100),
                    description TEXT,
                    contract VARCHAR(100),
                    sales_part_rebate_group VARCHAR(100),
                    invoiced_qty DOUBLE,
                    sale_um VARCHAR(50),
                    col_13 VARCHAR(100),
                    price_um VARCHAR(50),
                    calculated_unit_price DOUBLE,
                    invoice_date DATETIME,
                    net_dom_amount DOUBLE,
                    currency_code VARCHAR(50),
                    condition_code VARCHAR(100),
                    condition_code_desc VARCHAR(255),
                    order_no VARCHAR(100),
                    agreement_id VARCHAR(100),
                    cust_grp VARCHAR(100),
                    catalog_group VARCHAR(100),
                    region_code VARCHAR(100),
                    district_code VARCHAR(100),
                    market_code VARCHAR(100),
                    country_code VARCHAR(100),
                    salesman_code VARCHAR(100),
                    authorize_code VARCHAR(100),
                    price_list_no VARCHAR(100),
                    party VARCHAR(100),
                    party_type VARCHAR(100),
                    identity VARCHAR(100),
                    identity_name VARCHAR(255),
                    price_adjustment VARCHAR(50),
                    company VARCHAR(100),
                    price_conv VARCHAR(50),
                    INDEX idx_invoice_no (invoice_no),
                    INDEX idx_order_no (order_no),
                    INDEX idx_delivery_customer (delivery_customer),
                    INDEX idx_catalog_no (catalog_no),
                    INDEX idx_invoice_date (invoice_date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # 2. Table for Outstanding Output
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS outstanding_output (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    customer_no VARCHAR(100),
                    customer_name VARCHAR(255),
                    order_no VARCHAR(100),
                    line_no VARCHAR(50),
                    rel_no VARCHAR(50),
                    line_state VARCHAR(100),
                    agreement_id VARCHAR(100),
                    catalog_no VARCHAR(100),
                    catalog_desc TEXT,
                    condition_code VARCHAR(100),
                    condition_code_desc VARCHAR(255),
                    contract VARCHAR(100),
                    buy_qty_due DOUBLE,
                    sales_unit_meas VARCHAR(50),
                    calculated_qty DOUBLE,
                    price_unit_meas VARCHAR(50),
                    calculated_unit_price DOUBLE,
                    planned_delivery_date DATETIME,
                    backlog_value_base_curr DOUBLE,
                    currency_code VARCHAR(50),
                    cust_grp VARCHAR(100),
                    catalog_group VARCHAR(100),
                    region_code VARCHAR(100),
                    district_code VARCHAR(100),
                    market_code VARCHAR(100),
                    country_code VARCHAR(100),
                    salesman_code VARCHAR(100),
                    authorize_code VARCHAR(100),
                    price_list_no VARCHAR(100),
                    priority VARCHAR(50),
                    line_item_no VARCHAR(50),
                    INDEX idx_order_no (order_no),
                    INDEX idx_customer_no (customer_no),
                    INDEX idx_catalog_no (catalog_no),
                    INDEX idx_planned_delivery_date (planned_delivery_date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)
    finally:
        conn.close()

def clear_database(conn=None):
    """Truncate/clear data from gsh_dashboard MySQL database tables."""
    close_conn = False
    if conn is None:
        conn = get_db_connection()
        close_conn = True

    try:
        with conn.cursor() as cursor:
            cursor.execute("TRUNCATE TABLE invoice_output;")
            cursor.execute("TRUNCATE TABLE outstanding_output;")
    finally:
        if close_conn:
            conn.close()
