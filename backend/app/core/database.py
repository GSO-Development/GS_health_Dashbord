import os
import pymysql
import pymysql.cursors

# Auto-load .env file from project root
env_path = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "..", ".env"))
if os.path.isfile(env_path):
    try:
        with open(env_path, "r", encoding="utf-8") as f:
            for line in f:
                line = line.strip()
                if line and not line.startswith("#") and "=" in line:
                    k, v = line.split("=", 1)
                    os.environ.setdefault(k.strip(), v.strip())
    except Exception:
        pass

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

            # 3. Table for Total Budget
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS total_budget (
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

            # 4. Table for Dis Budget
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS dis_budget (
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

            # 5. Table for Axienta Data
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS axienta_data (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    entry_date DATE NOT NULL,
                    product_id VARCHAR(100),
                    product VARCHAR(255),
                    qty DOUBLE DEFAULT 0,
                    value DOUBLE DEFAULT 0,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                    INDEX idx_entry_date (entry_date)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # 6. Table for Users
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS users (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    username VARCHAR(50) NOT NULL UNIQUE,
                    full_name VARCHAR(100) NOT NULL,
                    email VARCHAR(100) NOT NULL UNIQUE,
                    password VARCHAR(255) DEFAULT '',
                    role VARCHAR(20) NOT NULL DEFAULT 'user',
                    account_type VARCHAR(20) DEFAULT 'system',
                    azure_oid VARCHAR(100) DEFAULT NULL,
                    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # Ensure columns exist if table was previously created
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN account_type VARCHAR(20) DEFAULT 'system';")
            except Exception:
                pass
            try:
                cursor.execute("ALTER TABLE users ADD COLUMN azure_oid VARCHAR(100) DEFAULT NULL;")
            except Exception:
                pass

            # 7. Table for Division Mappings
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS division_mappings (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    sales_group VARCHAR(150) NOT NULL,
                    range_name VARCHAR(150) NOT NULL,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
                    UNIQUE KEY uk_sales_group (sales_group, range_name)
                ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
            """)

            # 8. Table for Custom Dashboard Charts
            cursor.execute("""
                CREATE TABLE IF NOT EXISTS custom_dashboard_charts (
                    id INT AUTO_INCREMENT PRIMARY KEY,
                    chart_id VARCHAR(80) NOT NULL UNIQUE,
                    chart_title VARCHAR(200) NOT NULL,
                    chart_type VARCHAR(40) NOT NULL DEFAULT 'horizontal_bar',
                    target_formula TEXT,
                    actual_formula TEXT,
                    grid_row INT DEFAULT 0,
                    grid_col INT DEFAULT 0,
                    grid_span_cols INT DEFAULT 1,
                    grid_span_rows INT DEFAULT 1,
                    color_actual VARCHAR(20) DEFAULT '#10b981',
                    color_target VARCHAR(20) DEFAULT '#c8102e',
                    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
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
            cursor.execute("TRUNCATE TABLE total_budget;")
            cursor.execute("TRUNCATE TABLE dis_budget;")
            cursor.execute("TRUNCATE TABLE axienta_data;")
    finally:
        if close_conn:
            conn.close()
