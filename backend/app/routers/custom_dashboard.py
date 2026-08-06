from typing import Optional, List, Any
from fastapi import APIRouter, Body, Query
from app.core.database import get_db_connection
import json

router = APIRouter(prefix="/api/custom-dashboard", tags=["Custom Dashboard"])

# --- Column Definitions with Excel Letters ---
TABLE_COLUMNS = {
    "invoice_output": [
        {"col": "A", "field": "id", "label": "ID", "numeric": False},
        {"col": "B", "field": "delivery_customer", "label": "Delivery Customer", "numeric": False},
        {"col": "C", "field": "delivery_customer_name", "label": "Customer Name", "numeric": False},
        {"col": "D", "field": "invoice_id", "label": "Invoice ID", "numeric": False},
        {"col": "E", "field": "series_id", "label": "Series ID", "numeric": False},
        {"col": "F", "field": "invoice_no", "label": "Invoice No", "numeric": False},
        {"col": "G", "field": "item_id", "label": "Item ID", "numeric": False},
        {"col": "H", "field": "catalog_no", "label": "Catalog No", "numeric": False},
        {"col": "I", "field": "description", "label": "Description", "numeric": False},
        {"col": "J", "field": "contract", "label": "Contract", "numeric": False},
        {"col": "K", "field": "invoiced_qty", "label": "Invoiced Qty", "numeric": True},
        {"col": "L", "field": "sale_um", "label": "Sale UM", "numeric": False},
        {"col": "M", "field": "price_um", "label": "Price UM", "numeric": False},
        {"col": "N", "field": "calculated_unit_price", "label": "Unit Price", "numeric": True},
        {"col": "O", "field": "invoice_date", "label": "Invoice Date", "numeric": False},
        {"col": "P", "field": "net_dom_amount", "label": "Net Domestic Amount", "numeric": True},
        {"col": "Q", "field": "currency_code", "label": "Currency Code", "numeric": False},
        {"col": "R", "field": "order_no", "label": "Order No", "numeric": False},
        {"col": "S", "field": "cust_grp", "label": "Customer Group", "numeric": False},
        {"col": "T", "field": "catalog_group", "label": "Catalog Group", "numeric": False},
        {"col": "U", "field": "region_code", "label": "Region Code", "numeric": False},
        {"col": "V", "field": "district_code", "label": "District Code", "numeric": False},
        {"col": "W", "field": "salesman_code", "label": "Salesman Code", "numeric": False},
        {"col": "X", "field": "company", "label": "Company", "numeric": False},
    ],
    "outstanding_output": [
        {"col": "A", "field": "id", "label": "ID", "numeric": False},
        {"col": "B", "field": "customer_no", "label": "Customer No", "numeric": False},
        {"col": "C", "field": "customer_name", "label": "Customer Name", "numeric": False},
        {"col": "D", "field": "order_no", "label": "Order No", "numeric": False},
        {"col": "E", "field": "line_no", "label": "Line No", "numeric": False},
        {"col": "F", "field": "rel_no", "label": "Rel No", "numeric": False},
        {"col": "G", "field": "line_state", "label": "Line State", "numeric": False},
        {"col": "H", "field": "agreement_id", "label": "Agreement ID", "numeric": False},
        {"col": "I", "field": "catalog_no", "label": "Catalog No", "numeric": False},
        {"col": "J", "field": "catalog_desc", "label": "Description", "numeric": False},
        {"col": "K", "field": "buy_qty_due", "label": "Qty Due", "numeric": True},
        {"col": "L", "field": "calculated_qty", "label": "Calculated Qty", "numeric": True},
        {"col": "M", "field": "calculated_unit_price", "label": "Unit Price", "numeric": True},
        {"col": "N", "field": "planned_delivery_date", "label": "Delivery Date", "numeric": False},
        {"col": "O", "field": "backlog_value_base_curr", "label": "Backlog Value", "numeric": True},
        {"col": "P", "field": "currency_code", "label": "Currency Code", "numeric": False},
        {"col": "Q", "field": "cust_grp", "label": "Customer Group", "numeric": False},
        {"col": "R", "field": "catalog_group", "label": "Catalog Group", "numeric": False},
        {"col": "S", "field": "region_code", "label": "Region Code", "numeric": False},
        {"col": "T", "field": "salesman_code", "label": "Salesman Code", "numeric": False},
    ],
    "total_budget": [
        {"col": "A", "field": "id", "label": "ID", "numeric": False},
        {"col": "B", "field": "s_no", "label": "S.No", "numeric": False},
        {"col": "C", "field": "cost_center", "label": "Cost Center", "numeric": False},
        {"col": "D", "field": "sales_group", "label": "Sales Group", "numeric": False},
        {"col": "E", "field": "range_name", "label": "Range Name", "numeric": False},
        {"col": "F", "field": "part_no", "label": "Part No", "numeric": False},
        {"col": "G", "field": "product_sku", "label": "Product SKU", "numeric": False},
        {"col": "H", "field": "pack", "label": "Pack", "numeric": False},
        {"col": "I", "field": "april", "label": "April", "numeric": True},
        {"col": "J", "field": "may", "label": "May", "numeric": True},
        {"col": "K", "field": "june", "label": "June", "numeric": True},
        {"col": "L", "field": "july", "label": "July", "numeric": True},
        {"col": "M", "field": "august", "label": "August", "numeric": True},
        {"col": "N", "field": "september", "label": "September", "numeric": True},
        {"col": "O", "field": "october", "label": "October", "numeric": True},
        {"col": "P", "field": "november", "label": "November", "numeric": True},
        {"col": "Q", "field": "december", "label": "December", "numeric": True},
        {"col": "R", "field": "january", "label": "January", "numeric": True},
        {"col": "S", "field": "february", "label": "February", "numeric": True},
        {"col": "T", "field": "march", "label": "March", "numeric": True},
        {"col": "U", "field": "total", "label": "Total", "numeric": True},
    ],
    "dis_budget": [
        {"col": "A", "field": "id", "label": "ID", "numeric": False},
        {"col": "B", "field": "month", "label": "Month", "numeric": False},
        {"col": "C", "field": "product_id", "label": "Product ID", "numeric": False},
        {"col": "D", "field": "product", "label": "Product", "numeric": False},
        {"col": "E", "field": "division_name", "label": "Division Name", "numeric": False},
        {"col": "F", "field": "primary_target", "label": "Primary Target", "numeric": True},
        {"col": "G", "field": "primary_actual", "label": "Primary Actual", "numeric": True},
        {"col": "H", "field": "rd_target", "label": "RD Target", "numeric": True},
        {"col": "I", "field": "rd_actual", "label": "RD Actual", "numeric": True},
        {"col": "J", "field": "pri_pct", "label": "Pri %", "numeric": True},
        {"col": "K", "field": "rd_pct", "label": "RD %", "numeric": True},
        {"col": "L", "field": "qtr", "label": "Quarter", "numeric": False},
    ],
}


def init_custom_dashboard_table():
    conn = get_db_connection()
    with conn.cursor() as cursor:
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
            );
        """)
        # Seed default charts matching Dashboard FY
        defaults = [
            ("total_budget_vs_actual", "TOTAL BUDGET vs ACTUAL", "horizontal_bar",
             "SUM(total_budget.L)", "SUM(invoice_output.P) + SUM(outstanding_output.O)", 0, 0, 1, 1, "#10b981", "#c8102e"),
            ("direct_budget_vs_actual", "DIRECT BUDGET vs ACTUAL", "horizontal_bar",
             "SUM(total_budget.L) * 0.31", "SUM(invoice_output.P) * 0.37", 0, 1, 1, 1, "#10b981", "#c8102e"),
            ("dis_pri_budget_vs_actual", "DIS : PRI BUDGET vs ACTUAL", "horizontal_bar",
             "SUM(dis_budget.F)", "SUM(dis_budget.G)", 1, 0, 1, 1, "#10b981", "#c8102e"),
            ("dis_rd_budget_vs_actual", "DIS : RD BUDGET vs ACTUAL", "horizontal_bar",
             "SUM(dis_budget.H)", "SUM(dis_budget.I)", 1, 1, 1, 1, "#f59e0b", "#c8102e"),
            ("annual_budget_vs_actual", "ANNUAL BUDGET vs ACTUAL", "vertical_bar",
             "SUM(total_budget.U)", "SUM(invoice_output.P)", 0, 2, 1, 2, "#10b981", "#c8102e"),
        ]
        for d in defaults:
            cursor.execute("""
                INSERT IGNORE INTO custom_dashboard_charts 
                (chart_id, chart_title, chart_type, target_formula, actual_formula, 
                 grid_row, grid_col, grid_span_cols, grid_span_rows, color_actual, color_target)
                VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s);
            """, d)
    conn.close()


def evaluate_formula(formula: str, month_filter: str = None) -> float:
    """
    Evaluate Excel-style formula:
    e.g. SUM(invoice_output.P) + SUM(outstanding_output.O)
    e.g. SUM(total_budget.L)  (L = july)
    """
    import re
    conn = get_db_connection()
    result = 0.0

    # Parse tokens like SUM(table.ColLetter) optionally * factor
    tokens = re.findall(r'SUM\((\w+)\.([A-Z]+)\)', formula)
    operators = re.findall(r'SUM\(\w+\.[A-Z]+\)\s*([+\-\*\/])\s*', formula)
    scalar_factors = re.findall(r'\*\s*([\d.]+)', formula)

    values = []
    with conn.cursor() as cursor:
        for table, col_letter in tokens:
            if table not in TABLE_COLUMNS:
                values.append(0.0)
                continue
            col_def = next((c for c in TABLE_COLUMNS[table] if c["col"] == col_letter), None)
            if not col_def or not col_def["numeric"]:
                values.append(0.0)
                continue
            field = col_def["field"]
            try:
                cursor.execute(f"SELECT COALESCE(SUM(`{field}`), 0) as val FROM {table};")
                row = cursor.fetchone()
                values.append(float(row['val']))
            except Exception:
                values.append(0.0)

    conn.close()

    if not values:
        return 0.0

    # Simple left-to-right evaluation
    result = values[0]
    for i, op in enumerate(operators):
        if i + 1 < len(values):
            v = values[i + 1]
            if op == '+':
                result += v
            elif op == '-':
                result -= v
            elif op == '*':
                result *= v
            elif op == '/':
                result = result / v if v != 0 else result

    # Apply any final scalar multiplier
    for sf in scalar_factors:
        result *= float(sf)

    return round(result, 2)


@router.get("/schema")
def get_schema():
    """Return available tables and their Excel column mappings"""
    return {"tables": TABLE_COLUMNS}


@router.get("/charts")
def get_all_charts():
    """Fetch all stored chart configurations"""
    init_custom_dashboard_table()
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM custom_dashboard_charts ORDER BY grid_row ASC, grid_col ASC;")
        charts = cursor.fetchall()
    conn.close()
    return {"charts": charts}


@router.post("/charts")
def save_chart(payload: dict = Body(...)):
    """Create or update a chart configuration"""
    init_custom_dashboard_table()
    required = ["chart_id", "chart_title", "chart_type", "target_formula", "actual_formula"]
    for key in required:
        if key not in payload:
            return {"error": f"Missing required field: {key}"}

    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            INSERT INTO custom_dashboard_charts 
            (chart_id, chart_title, chart_type, target_formula, actual_formula,
             grid_row, grid_col, grid_span_cols, grid_span_rows, color_actual, color_target)
            VALUES (%(chart_id)s, %(chart_title)s, %(chart_type)s, %(target_formula)s, %(actual_formula)s,
                    %(grid_row)s, %(grid_col)s, %(grid_span_cols)s, %(grid_span_rows)s, %(color_actual)s, %(color_target)s)
            ON DUPLICATE KEY UPDATE
                chart_title=VALUES(chart_title),
                chart_type=VALUES(chart_type),
                target_formula=VALUES(target_formula),
                actual_formula=VALUES(actual_formula),
                grid_row=VALUES(grid_row),
                grid_col=VALUES(grid_col),
                grid_span_cols=VALUES(grid_span_cols),
                grid_span_rows=VALUES(grid_span_rows),
                color_actual=VALUES(color_actual),
                color_target=VALUES(color_target);
        """, {
            "chart_id": payload["chart_id"],
            "chart_title": payload["chart_title"],
            "chart_type": payload["chart_type"],
            "target_formula": payload["target_formula"],
            "actual_formula": payload["actual_formula"],
            "grid_row": payload.get("grid_row", 0),
            "grid_col": payload.get("grid_col", 0),
            "grid_span_cols": payload.get("grid_span_cols", 1),
            "grid_span_rows": payload.get("grid_span_rows", 1),
            "color_actual": payload.get("color_actual", "#10b981"),
            "color_target": payload.get("color_target", "#c8102e"),
        })
    conn.close()
    return {"success": True, "chart_id": payload["chart_id"]}


@router.post("/evaluate")
def evaluate_chart_formula(payload: dict = Body(...)):
    """Evaluate a formula string and return the result"""
    formula = payload.get("formula", "")
    if not formula.strip():
        return {"result": 0.0, "error": "Empty formula"}
    try:
        result = evaluate_formula(formula)
        return {"result": result, "formula": formula}
    except Exception as e:
        return {"result": 0.0, "error": str(e)}


@router.get("/computed-chart-data")
def get_computed_chart_data():
    """Evaluate all stored formulas and return computed target/actual for Dashboard FY"""
    init_custom_dashboard_table()
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("SELECT * FROM custom_dashboard_charts ORDER BY grid_row ASC, grid_col ASC;")
        charts = cursor.fetchall()
    conn.close()

    computed = []
    for chart in charts:
        try:
            target_val = evaluate_formula(chart["target_formula"] or "0")
        except Exception:
            target_val = 0.0
        try:
            actual_val = evaluate_formula(chart["actual_formula"] or "0")
        except Exception:
            actual_val = 0.0

        pct = round((actual_val / target_val) * 100) if target_val else 0
        variance = round(actual_val - target_val, 2)

        computed.append({
            **chart,
            "target_value": target_val,
            "actual_value": actual_val,
            "pct": pct,
            "variance": variance,
        })

    return {"charts": computed}


@router.delete("/charts/{chart_id}")
def delete_chart(chart_id: str):
    """Delete a chart configuration"""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("DELETE FROM custom_dashboard_charts WHERE chart_id=%s;", (chart_id,))
    conn.close()
    return {"success": True, "deleted": chart_id}
