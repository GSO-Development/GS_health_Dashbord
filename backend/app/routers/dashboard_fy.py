import calendar
from typing import Optional
from fastapi import APIRouter, Query
from app.core.database import get_db_connection

router = APIRouter(prefix="/api/reports", tags=["Dashboard FY"])

MONTH_MAPPING = {
    "april": 4, "may": 5, "june": 6, "july": 7,
    "august": 8, "september": 9, "october": 10,
    "november": 11, "december": 12, "january": 1,
    "february": 2, "march": 3
}

MONTH_NAMES = {
    "april": "April 2026", "may": "May 2026", "june": "June 2026", "july": "July 2026",
    "august": "August 2026", "september": "September 2026", "october": "October 2026",
    "november": "November 2026", "december": "December 2026", "january": "January 2027",
    "february": "February 2027", "march": "March 2027"
}

@router.get("/dashboard-fy-overview")
def get_dashboard_fy_overview(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None)
):
    selected_month = month.lower().strip() if month and month.lower().strip() in MONTH_MAPPING else "july"
    month_num = MONTH_MAPPING[selected_month]
    month_name = MONTH_NAMES[selected_month]
    year = 2027 if month_num in [1, 2, 3] else 2026

    # Determine days in selected month for target pro-rata
    _, days_in_month = calendar.monthrange(year, month_num)
    filter_date = date.strip() if date and date.strip() else None

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # ─── 1. TOTAL BUDGET vs ACTUAL – CURRENT MONTH ───
        cursor.execute(f"SELECT COALESCE(SUM({selected_month}), 0) as target FROM total_budget;")
        monthly_total_target = float(cursor.fetchone()['target'] or 0.0)
        total_target_val = (monthly_total_target / days_in_month) if filter_date else monthly_total_target

        if filter_date:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as inv_net 
                FROM invoice_output 
                WHERE DATE(invoice_date) = %s;
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as inv_net 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s;
            """, (month_num, year))
        inv_net = float(cursor.fetchone()['inv_net'] or 0.0)

        cursor.execute("""
            SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back_val 
            FROM outstanding_output 
            WHERE UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL;
        """)
        out_back_non_gstea = float(cursor.fetchone()['back_val'] or 0.0)

        total_actual_val = inv_net + (0.0 if filter_date else out_back_non_gstea)
        total_pct = round((total_actual_val / total_target_val) * 100) if total_target_val > 0 else 0
        total_variance = total_actual_val - total_target_val

        # ─── 2. DIS : PRI BUDGET vs ACTUAL – CURRENT MONTH ───
        if filter_date:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE DATE(invoice_date) = %s 
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s 
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (month_num, year))
        dis_pri_inv = float(cursor.fetchone()['dis_inv'] or 0.0)

        cursor.execute("""
            SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dis_back 
            FROM outstanding_output 
            WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
              AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
        """)
        dis_pri_back = float(cursor.fetchone()['dis_back'] or 0.0)

        pri_actual = dis_pri_inv + (0.0 if filter_date else dis_pri_back)

        cursor.execute("""
            SELECT COALESCE(SUM(primary_target), 0) as pri_target 
            FROM dis_budget 
            WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
        """, (month_num, f"%-{month_num:02d}-%", selected_month))
        monthly_pri_target = float(cursor.fetchone()['pri_target'] or 0.0)
        pri_target = (monthly_pri_target / days_in_month) if filter_date else monthly_pri_target

        pri_pct = round((pri_actual / pri_target) * 100) if pri_target > 0 else 0
        pri_variance = pri_actual - pri_target

        # ─── 3. DIRECT BUDGET vs ACTUAL – CURRENT MONTH ───
        if filter_date:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dir_inv 
                FROM invoice_output 
                WHERE DATE(invoice_date) = %s 
                  AND (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dir_inv 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s 
                  AND (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (month_num, year))
        dir_inv_net = float(cursor.fetchone()['dir_inv'] or 0.0)

        cursor.execute("""
            SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dir_back 
            FROM outstanding_output 
            WHERE (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
              AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
        """)
        dir_out_back = float(cursor.fetchone()['dir_back'] or 0.0)

        direct_actual = dir_inv_net + (0.0 if filter_date else dir_out_back)

        direct_target = total_target_val - pri_target
        if direct_target < 0:
            direct_target = 0.0

        direct_pct = round((direct_actual / direct_target) * 100) if direct_target > 0 else 0
        direct_variance = direct_actual - direct_target

        # ─── 4. DIS : RD BUDGET vs ACTUAL ───
        if filter_date:
            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as rd_act 
                FROM axienta_data 
                WHERE DATE(entry_date) = %s;
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as rd_act 
                FROM axienta_data 
                WHERE MONTH(entry_date) = %s AND YEAR(entry_date) = %s;
            """, (month_num, year))
        rd_actual = float(cursor.fetchone()['rd_act'] or 0.0)

        cursor.execute("""
            SELECT COALESCE(SUM(rd_target), 0) as rd_target 
            FROM dis_budget 
            WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
        """, (month_num, f"%-{month_num:02d}-%", selected_month))
        monthly_rd_target = float(cursor.fetchone()['rd_target'] or 0.0)
        rd_target = (monthly_rd_target / days_in_month) if filter_date else monthly_rd_target

        rd_pct = round((rd_actual / rd_target) * 100) if rd_target > 0 else 0
        rd_variance = rd_actual - rd_target

        # ─── 5. ANNUAL BUDGET vs ACTUAL ───
        cursor.execute("SELECT COALESCE(SUM(total), 0) as annual_target FROM total_budget;")
        annual_target = float(cursor.fetchone()['annual_target'] or 13554000000.0)
        annual_actual = total_actual_val
        annual_pct = round((annual_actual / annual_target) * 100) if annual_target > 0 else 0

    conn.close()

    label_text = f"Date: {filter_date}" if filter_date else month_name

    return {
        "selected_month": selected_month,
        "selected_date": filter_date,
        "month_label": label_text,
        "total_budget": {
            "target": round(total_target_val, 2),
            "actual": round(total_actual_val, 2),
            "pct": total_pct,
            "variance": round(total_variance, 2),
        },
        "direct_budget": {
            "target": round(direct_target, 2),
            "actual": round(direct_actual, 2),
            "pct": direct_pct,
            "variance": round(direct_variance, 2),
        },
        "dis_pri": {
            "target": round(pri_target, 2),
            "actual": round(pri_actual, 2),
            "pct": pri_pct,
            "variance": round(pri_variance, 2),
        },
        "dis_rd": {
            "target": round(rd_target, 2),
            "actual": round(rd_actual, 2),
            "pct": rd_pct,
            "variance": round(rd_variance, 2),
        },
        "annual": {
            "target": round(annual_target, 2),
            "actual": round(annual_actual, 2),
            "pct": annual_pct,
        }
    }


# ─── DIS DASHBOARD FY OVERVIEW ENDPOINT ───
@router.get("/dis-dashboard-fy-overview")
def get_dis_dashboard_fy_overview(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None)
):
    selected_month = month.lower().strip() if month and month.lower().strip() in MONTH_MAPPING else "july"
    month_num = MONTH_MAPPING[selected_month]
    month_name = MONTH_NAMES[selected_month]
    year = 2027 if month_num in [1, 2, 3] else 2026

    _, days_in_month = calendar.monthrange(year, month_num)
    filter_date = date.strip() if date and date.strip() else None

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # 1. Primary Sales Details (cust_grp = 'DISTRI')
        if filter_date:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE DATE(invoice_date) = %s 
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s 
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (month_num, year))
        pri_inv = float(cursor.fetchone()['dis_inv'] or 0.0)

        cursor.execute("""
            SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dis_back 
            FROM outstanding_output 
            WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
              AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
        """)
        pri_back = float(cursor.fetchone()['dis_back'] or 0.0)

        pri_actual = pri_inv + (0.0 if filter_date else pri_back)

        cursor.execute("""
            SELECT COALESCE(SUM(primary_target), 0) as pri_target 
            FROM dis_budget 
            WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
        """, (month_num, f"%-{month_num:02d}-%", selected_month))
        monthly_pri_target = float(cursor.fetchone()['pri_target'] or 0.0)
        pri_target = (monthly_pri_target / days_in_month) if filter_date else monthly_pri_target

        pri_pct = round((pri_actual / pri_target) * 100) if pri_target > 0 else 0
        pri_variance = pri_actual - pri_target

        # 2. RD Sales Details (axienta_data.value)
        if filter_date:
            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as rd_act 
                FROM axienta_data 
                WHERE DATE(entry_date) = %s;
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as rd_act 
                FROM axienta_data 
                WHERE MONTH(entry_date) = %s AND YEAR(entry_date) = %s;
            """, (month_num, year))
        rd_actual = float(cursor.fetchone()['rd_act'] or 0.0)

        cursor.execute("""
            SELECT COALESCE(SUM(rd_target), 0) as rd_target 
            FROM dis_budget 
            WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
        """, (month_num, f"%-{month_num:02d}-%", selected_month))
        monthly_rd_target = float(cursor.fetchone()['rd_target'] or 0.0)
        rd_target = (monthly_rd_target / days_in_month) if filter_date else monthly_rd_target

        rd_pct = round((rd_actual / rd_target) * 100) if rd_target > 0 else 0
        rd_variance = rd_actual - rd_target

        # 3. Full Year Totals
        cursor.execute("SELECT COALESCE(SUM(primary_target), 0) as fy_pri_tgt, COALESCE(SUM(rd_target), 0) as fy_rd_tgt FROM dis_budget;")
        fy_dis = cursor.fetchone()
        fy_pri_target = float(fy_dis['fy_pri_tgt'] or 0.0)
        fy_rd_target = float(fy_dis['fy_rd_tgt'] or 0.0)

        cursor.execute("""
            SELECT COALESCE(SUM(net_dom_amount), 0) as fy_pri_inv 
            FROM invoice_output 
            WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
              AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
        """)
        fy_pri_inv = float(cursor.fetchone()['fy_pri_inv'] or 0.0)
        fy_pri_actual = fy_pri_inv + pri_back
        fy_pri_pct = round((fy_pri_actual / fy_pri_target) * 100) if fy_pri_target > 0 else 0

        cursor.execute("SELECT COALESCE(SUM(value), 0) as fy_rd_act FROM axienta_data;")
        fy_rd_actual = float(cursor.fetchone()['fy_rd_act'] or 0.0)
        fy_rd_pct = round((fy_rd_actual / fy_rd_target) * 100) if fy_rd_target > 0 else 0

        # 4. Monthly / Quarterly Breakdown
        monthly_breakdown = []
        ordered_months = [
            ("april", 4, 2026), ("may", 5, 2026), ("june", 6, 2026),
            ("july", 7, 2026), ("august", 8, 2026), ("september", 9, 2026),
            ("october", 10, 2026), ("november", 11, 2026), ("december", 12, 2026),
            ("january", 1, 2027), ("february", 2, 2027), ("march", 3, 2027)
        ]

        for m_key, m_code, m_yr in ordered_months:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as inv 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s 
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (m_code, m_yr))
            m_pri_inv = float(cursor.fetchone()['inv'] or 0.0)
            m_pri_act = m_pri_inv + (pri_back if m_code == month_num else 0.0)

            cursor.execute("""
                SELECT COALESCE(SUM(primary_target), 0) as tgt 
                FROM dis_budget 
                WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
            """, (m_code, f"%-{m_code:02d}-%", m_key))
            m_pri_tgt = float(cursor.fetchone()['tgt'] or 0.0)

            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as val 
                FROM axienta_data 
                WHERE MONTH(entry_date) = %s AND YEAR(entry_date) = %s;
            """, (m_code, m_yr))
            m_rd_act = float(cursor.fetchone()['val'] or 0.0)

            cursor.execute("""
                SELECT COALESCE(SUM(rd_target), 0) as tgt 
                FROM dis_budget 
                WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
            """, (m_code, f"%-{m_code:02d}-%", m_key))
            m_rd_tgt = float(cursor.fetchone()['tgt'] or 0.0)

            qtr_label = "1st QTR" if m_code in [4, 5, 6] else ("2nd QTR" if m_code in [7, 8, 9] else ("3rd QTR" if m_code in [10, 11, 12] else "4th QTR"))

            monthly_breakdown.append({
                "month_key": m_key,
                "month_short": m_key[:3].capitalize(),
                "qtr": qtr_label,
                "pri_act": round(m_pri_act, 2),
                "pri_tgt": round(m_pri_tgt, 2),
                "rd_act": round(m_rd_act, 2),
                "rd_tgt": round(m_rd_tgt, 2)
            })

    conn.close()

    label_text = f"Date: {filter_date}" if filter_date else month_name

    return {
        "selected_month": selected_month,
        "selected_date": filter_date,
        "month_label": label_text,
        "primary_sales": {
            "actual": round(pri_actual, 2),
            "target": round(pri_target, 2),
            "pct": pri_pct,
            "variance": round(pri_variance, 2),
        },
        "rd_sales": {
            "actual": round(rd_actual, 2),
            "target": round(rd_target, 2),
            "pct": rd_pct,
            "variance": round(rd_variance, 2),
        },
        "full_year": {
            "pri_target": round(fy_pri_target, 2),
            "pri_actual": round(fy_pri_actual, 2),
            "pri_pct": fy_pri_pct,
            "rd_target": round(fy_rd_target, 2),
            "rd_actual": round(fy_rd_actual, 2),
            "rd_pct": fy_rd_pct
        },
        "monthly_breakdown": monthly_breakdown
    }


# ─── DISTRI RANGE WISE FY API ENDPOINT ───
@router.get("/distri-range-fy")
def get_distri_range_fy(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None)
):
    selected_month = month.lower().strip() if month and month.lower().strip() in MONTH_MAPPING else "july"
    month_num = MONTH_MAPPING[selected_month]
    month_name = MONTH_NAMES[selected_month]
    year = 2027 if month_num in [1, 2, 3] else 2026

    _, days_in_month = calendar.monthrange(year, month_num)
    filter_date = date.strip() if date and date.strip() else None

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # 1. Primary target & RD target from dis_budget
        cursor.execute("""
            SELECT 
                TRIM(product_id) as pid,
                COALESCE(SUM(primary_target), 0) as m_pri_tgt,
                COALESCE(SUM(rd_target), 0) as m_rd_tgt
            FROM dis_budget
            WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s
            GROUP BY TRIM(product_id);
        """, (month_num, f"%-{month_num:02d}-%", selected_month))
        dis_budget_map = {}
        for r in cursor.fetchall():
            pid = r['pid']
            m_pri = float(r['m_pri_tgt'] or 0.0)
            m_rd = float(r['m_rd_tgt'] or 0.0)
            dis_budget_map[pid] = {
                'pid': pid,
                'm_pri_tgt': (m_pri / days_in_month) if filter_date else m_pri,
                'm_rd_tgt': (m_rd / days_in_month) if filter_date else m_rd
            }

        # 2. Cumulative Primary target & RD target from dis_budget
        cursor.execute("""
            SELECT 
                TRIM(product_id) as pid,
                COALESCE(SUM(primary_target), 0) as c_pri_tgt,
                COALESCE(SUM(rd_target), 0) as c_rd_tgt
            FROM dis_budget
            WHERE MONTH(month) <= %s
            GROUP BY TRIM(product_id);
        """, (month_num,))
        dis_budget_c_map = {r['pid']: r for r in cursor.fetchall()}

        # 3. RD actual from axienta_data
        if filter_date:
            cursor.execute("""
                SELECT 
                    TRIM(product_id) as pid,
                    COALESCE(SUM(value), 0) as m_rd_act
                FROM axienta_data
                WHERE DATE(entry_date) = %s
                GROUP BY TRIM(product_id);
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT 
                    TRIM(product_id) as pid,
                    COALESCE(SUM(value), 0) as m_rd_act
                FROM axienta_data
                WHERE MONTH(entry_date) = %s AND YEAR(entry_date) = %s
                GROUP BY TRIM(product_id);
            """, (month_num, year))
        axienta_m_map = {r['pid']: r['m_rd_act'] for r in cursor.fetchall()}

        # 4. Cumulative RD actual from axienta_data
        cursor.execute("""
            SELECT 
                TRIM(product_id) as pid,
                COALESCE(SUM(value), 0) as c_rd_act
            FROM axienta_data
            WHERE MONTH(entry_date) <= %s AND YEAR(entry_date) = %s
            GROUP BY TRIM(product_id);
        """, (month_num, year))
        axienta_c_map = {r['pid']: r['c_rd_act'] for r in cursor.fetchall()}

        # 5. Primary actual from invoice_output
        if filter_date:
            cursor.execute("""
                SELECT 
                    TRIM(catalog_no) as pid,
                    COALESCE(SUM(net_dom_amount), 0) as m_inv
                FROM invoice_output
                WHERE DATE(invoice_date) = %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
                GROUP BY TRIM(catalog_no);
            """, (filter_date,))
        else:
            cursor.execute("""
                SELECT 
                    TRIM(catalog_no) as pid,
                    COALESCE(SUM(net_dom_amount), 0) as m_inv
                FROM invoice_output
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
                GROUP BY TRIM(catalog_no);
            """, (month_num, year))
        inv_m_map = {r['pid']: r['m_inv'] for r in cursor.fetchall()}

        # 6. Cumulative Primary actual from invoice_output
        cursor.execute("""
            SELECT 
                TRIM(catalog_no) as pid,
                COALESCE(SUM(net_dom_amount), 0) as c_inv
            FROM invoice_output
            WHERE MONTH(invoice_date) <= %s AND YEAR(invoice_date) = %s
              AND UPPER(TRIM(cust_grp)) = 'DISTRI'
              AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
            GROUP BY TRIM(catalog_no);
        """, (month_num, year))
        inv_c_map = {r['pid']: r['c_inv'] for r in cursor.fetchall()}

        # 7. Backlog from outstanding_output
        cursor.execute("""
            SELECT 
                TRIM(catalog_no) as pid,
                COALESCE(SUM(backlog_value_base_curr), 0) as back
            FROM outstanding_output
            WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
              AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
            GROUP BY TRIM(catalog_no);
        """)
        back_map = {r['pid']: r['back'] for r in cursor.fetchall()}

        # 8. All distinct items from total_budget
        cursor.execute("""
            SELECT DISTINCT
                TRIM(range_name) as division_name,
                TRIM(sales_group) as subgroup_name,
                TRIM(part_no) as part_no,
                TRIM(product_sku) as product_sku
            FROM total_budget
            WHERE range_name IS NOT NULL AND TRIM(range_name) != ''
              AND sales_group IS NOT NULL AND TRIM(sales_group) != ''
            ORDER BY division_name, subgroup_name, part_no;
        """)
        tb_items = cursor.fetchall()

        # Build hierarchy tree
        divisions = {}
        for row in tb_items:
            div_name = row['division_name']
            sub_name = row['subgroup_name']
            pno = row['part_no']
            psku = row['product_sku']

            b_info = dis_budget_map.get(pno, {})
            b_c_info = dis_budget_c_map.get(pno, {})

            item_pri_tgt = float(b_info.get('m_pri_tgt', 0.0))
            item_rd_tgt = float(b_info.get('m_rd_tgt', 0.0))
            item_pri_act = float(inv_m_map.get(pno, 0.0)) + (0.0 if filter_date else float(back_map.get(pno, 0.0)))
            item_rd_act = float(axienta_m_map.get(pno, 0.0))

            item_c_pri_tgt = float(b_c_info.get('c_pri_tgt', 0.0))
            item_c_rd_tgt = float(b_c_info.get('c_rd_tgt', 0.0))
            item_c_pri_act = float(inv_c_map.get(pno, 0.0)) + float(back_map.get(pno, 0.0))
            item_c_rd_act = float(axienta_c_map.get(pno, 0.0))

            item_obj = {
                "part_no": pno,
                "product_sku": psku,
                "pri_target": round(item_pri_tgt, 2),
                "pri_actual": round(item_pri_act, 2),
                "rd_target": round(item_rd_tgt, 2),
                "rd_actual": round(item_rd_act, 2),
                "c_pri_target": round(item_c_pri_tgt, 2),
                "c_pri_actual": round(item_c_pri_act, 2),
                "c_rd_target": round(item_c_rd_tgt, 2),
                "c_rd_actual": round(item_c_rd_act, 2)
            }

            if div_name not in divisions:
                divisions[div_name] = {}
            if sub_name not in divisions[div_name]:
                divisions[div_name][sub_name] = []
            divisions[div_name][sub_name].append(item_obj)

        tree = []
        g_pri_tgt = g_pri_act = g_rd_tgt = g_rd_act = 0.0
        g_c_pri_tgt = g_c_pri_act = g_c_rd_tgt = g_c_rd_act = 0.0

        for div_name, subs in divisions.items():
            div_pri_tgt = div_pri_act = div_rd_tgt = div_rd_act = 0.0
            div_c_pri_tgt = div_c_pri_act = div_c_rd_tgt = div_c_rd_act = 0.0
            sub_list = []

            for sub_name, items in subs.items():
                s_pri_tgt = sum(i['pri_target'] for i in items)
                s_pri_act = sum(i['pri_actual'] for i in items)
                s_rd_tgt = sum(i['rd_target'] for i in items)
                s_rd_act = sum(i['rd_actual'] for i in items)

                s_c_pri_tgt = sum(i['c_pri_target'] for i in items)
                s_c_pri_act = sum(i['c_pri_actual'] for i in items)
                s_c_rd_tgt = sum(i['c_rd_target'] for i in items)
                s_c_rd_act = sum(i['c_rd_actual'] for i in items)

                sub_list.append({
                    "subgroup_name": sub_name,
                    "pri_target": round(s_pri_tgt, 2),
                    "pri_actual": round(s_pri_act, 2),
                    "rd_target": round(s_rd_tgt, 2),
                    "rd_actual": round(s_rd_act, 2),
                    "c_pri_target": round(s_c_pri_tgt, 2),
                    "c_pri_actual": round(s_c_pri_act, 2),
                    "c_rd_target": round(s_c_rd_tgt, 2),
                    "c_rd_actual": round(s_c_rd_act, 2),
                    "items": items
                })

                div_pri_tgt += s_pri_tgt
                div_pri_act += s_pri_act
                div_rd_tgt += s_rd_tgt
                div_rd_act += s_rd_act

                div_c_pri_tgt += s_c_pri_tgt
                div_c_pri_act += s_c_pri_act
                div_c_rd_tgt += s_c_rd_tgt
                div_c_rd_act += s_c_rd_act

            tree.append({
                "division_name": div_name,
                "pri_target": round(div_pri_tgt, 2),
                "pri_actual": round(div_pri_act, 2),
                "rd_target": round(div_rd_tgt, 2),
                "rd_actual": round(div_rd_act, 2),
                "c_pri_target": round(div_c_pri_tgt, 2),
                "c_pri_actual": round(div_c_pri_act, 2),
                "c_rd_target": round(div_c_rd_tgt, 2),
                "c_rd_actual": round(div_c_rd_act, 2),
                "subgroups": sub_list
            })

            g_pri_tgt += div_pri_tgt
            g_pri_act += div_pri_act
            g_rd_tgt += div_rd_tgt
            g_rd_act += div_rd_act

            g_c_pri_tgt += div_c_pri_tgt
            g_c_pri_act += div_c_pri_act
            g_c_rd_tgt += div_c_rd_tgt
            g_c_rd_act += div_c_rd_act

    conn.close()

    label_text = f"Date: {filter_date}" if filter_date else month_name

    return {
        "selected_month": selected_month,
        "selected_date": filter_date,
        "month_label": label_text,
        "grand_total": {
            "pri_target": round(g_pri_tgt, 2),
            "pri_actual": round(g_pri_act, 2),
            "rd_target": round(g_rd_tgt, 2),
            "rd_actual": round(g_rd_act, 2),
            "c_pri_target": round(g_c_pri_tgt, 2),
            "c_pri_actual": round(g_c_pri_act, 2),
            "c_rd_target": round(g_c_rd_tgt, 2),
            "c_rd_actual": round(g_c_rd_act, 2)
        },
        "tree": tree
    }
