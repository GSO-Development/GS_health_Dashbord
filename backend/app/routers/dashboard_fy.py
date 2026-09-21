import calendar
from datetime import datetime
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

def resolve_date_filter(month: str, date: Optional[str] = None, start_date: Optional[str] = None, end_date: Optional[str] = None):
    m_clean = month.lower().strip() if isinstance(month, str) else "july"
    selected_month = m_clean if m_clean in MONTH_MAPPING else "july"
    month_num = MONTH_MAPPING[selected_month]
    month_name = MONTH_NAMES[selected_month]
    year = 2027 if month_num in [1, 2, 3] else 2026
    _, days_in_month = calendar.monthrange(year, month_num)

    s_date = start_date.strip() if isinstance(start_date, str) and start_date.strip() else None
    e_date = end_date.strip() if isinstance(end_date, str) and end_date.strip() else None
    single_d = date.strip() if isinstance(date, str) and date.strip() else None

    if not s_date and single_d:
        s_date = single_d
        e_date = single_d

    if s_date and not e_date:
        e_date = s_date
    elif e_date and not s_date:
        s_date = e_date

    if s_date and e_date:
        if s_date > e_date:
            s_date, e_date = e_date, s_date
        try:
            d1 = datetime.strptime(s_date, "%Y-%m-%d").date()
            d2 = datetime.strptime(e_date, "%Y-%m-%d").date()
            days_count = max(1, (d2 - d1).days + 1)
        except Exception:
            days_count = 1

        if s_date == e_date:
            label = f"Date: {s_date}"
            is_single = True
        else:
            label = f"{s_date} to {e_date} ({days_count} Days)"
            is_single = False
        return {
            "selected_month": selected_month,
            "month_num": month_num,
            "year": year,
            "days_in_month": days_in_month,
            "filter_start": s_date,
            "filter_end": e_date,
            "days_count": days_count,
            "is_single": is_single,
            "label": label
        }

    return {
        "selected_month": selected_month,
        "month_num": month_num,
        "year": year,
        "days_in_month": days_in_month,
        "filter_start": None,
        "filter_end": None,
        "days_count": days_in_month,
        "is_single": False,
        "label": month_name
    }


@router.get("/dashboard-fy-overview")
def get_dashboard_fy_overview(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    backlog_mode: Optional[str] = Query("with")
):
    df_info = resolve_date_filter(month, date, start_date, end_date)
    selected_month = df_info["selected_month"]
    month_num = df_info["month_num"]
    year = df_info["year"]
    days_in_month = df_info["days_in_month"]
    filter_start = df_info["filter_start"]
    filter_end = df_info["filter_end"]
    days_count = df_info["days_count"]
    has_date_filter = filter_start is not None
    mode = backlog_mode.lower().strip() if backlog_mode and backlog_mode.lower().strip() in ["with", "without", "only"] else "with"

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # ─── 1. TOTAL BUDGET vs ACTUAL – CURRENT MONTH ───
        cursor.execute(f"SELECT COALESCE(SUM({selected_month}), 0) as target FROM total_budget;")
        monthly_total_target = float(cursor.fetchone()['target'] or 0.0)
        total_target_val = (monthly_total_target / days_in_month * days_count) if has_date_filter else monthly_total_target

        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as inv_net 
                FROM invoice_output 
                WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s;
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as inv_net 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s;
            """, (month_num, year))
        inv_net = float(cursor.fetchone()['inv_net'] or 0.0)

        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back_val 
                FROM outstanding_output 
                WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back_val 
                FROM outstanding_output 
                WHERE UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL;
            """)
        out_back_non_gstea = float(cursor.fetchone()['back_val'] or 0.0)

        if mode == "without":
            total_actual_val = inv_net
        elif mode == "only":
            total_actual_val = out_back_non_gstea
        else:
            total_actual_val = inv_net + out_back_non_gstea

        total_pct = round((total_actual_val / total_target_val) * 100) if total_target_val > 0 else 0
        total_variance = total_actual_val - total_target_val

        # ─── 2. DIS : PRI BUDGET vs ACTUAL – CURRENT MONTH ───
        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s 
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (month_num, year))
        dis_pri_inv = float(cursor.fetchone()['dis_inv'] or 0.0)

        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dis_back 
                FROM outstanding_output 
                WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dis_back 
                FROM outstanding_output 
                WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """)
        dis_pri_back = float(cursor.fetchone()['dis_back'] or 0.0)

        if mode == "without":
            pri_actual = dis_pri_inv
        elif mode == "only":
            pri_actual = dis_pri_back
        else:
            pri_actual = dis_pri_inv + dis_pri_back

        cursor.execute("""
            SELECT COALESCE(SUM(primary_target), 0) as pri_target 
            FROM dis_budget 
            WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
        """, (month_num, f"%-{month_num:02d}-%", selected_month))
        monthly_pri_target = float(cursor.fetchone()['pri_target'] or 0.0)
        pri_target = (monthly_pri_target / days_in_month * days_count) if has_date_filter else monthly_pri_target

        pri_pct = round((pri_actual / pri_target) * 100) if pri_target > 0 else 0
        pri_variance = pri_actual - pri_target

        # ─── 3. DIRECT BUDGET vs ACTUAL – CURRENT MONTH ───
        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dir_inv 
                FROM invoice_output 
                WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s
                  AND (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dir_inv 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s 
                  AND (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (month_num, year))
        dir_inv_net = float(cursor.fetchone()['dir_inv'] or 0.0)

        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dir_back 
                FROM outstanding_output 
                WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s
                  AND (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dir_back 
                FROM outstanding_output 
                WHERE (UPPER(TRIM(cust_grp)) != 'DISTRI' OR cust_grp IS NULL)
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """)
        dir_out_back = float(cursor.fetchone()['dir_back'] or 0.0)

        if mode == "without":
            direct_actual = dir_inv_net
        elif mode == "only":
            direct_actual = dir_out_back
        else:
            direct_actual = dir_inv_net + dir_out_back

        direct_target = total_target_val - pri_target
        if direct_target < 0:
            direct_target = 0.0

        direct_pct = round((direct_actual / direct_target) * 100) if direct_target > 0 else 0
        direct_variance = direct_actual - direct_target

        # ─── 4. DIS : RD BUDGET vs ACTUAL ───
        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as rd_act 
                FROM axienta_data 
                WHERE DATE(entry_date) >= %s AND DATE(entry_date) <= %s;
            """, (filter_start, filter_end))
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
        rd_target = (monthly_rd_target / days_in_month * days_count) if has_date_filter else monthly_rd_target

        rd_pct = round((rd_actual / rd_target) * 100) if rd_target > 0 else 0
        rd_variance = rd_actual - rd_target

        # ─── 5. ANNUAL BUDGET vs ACTUAL ───
        cursor.execute("SELECT COALESCE(SUM(total), 0) as annual_target FROM total_budget;")
        annual_target = float(cursor.fetchone()['annual_target'] or 13554000000.0)
        annual_actual = total_actual_val
        annual_pct = round((annual_actual / annual_target) * 100) if annual_target > 0 else 0

    conn.close()

    return {
        "selected_month": selected_month,
        "selected_date": filter_start if df_info["is_single"] else None,
        "start_date": filter_start,
        "end_date": filter_end,
        "days_count": days_count,
        "month_label": df_info["label"],
        "backlog_mode": mode,
        "total_budget": {
            "target": round(total_target_val, 2),
            "actual": round(total_actual_val, 2),
            "invoiced": round(inv_net, 2),
            "backlog": round(out_back_non_gstea, 2),
            "pct": total_pct,
            "variance": round(total_variance, 2),
        },
        "direct_budget": {
            "target": round(direct_target, 2),
            "actual": round(direct_actual, 2),
            "invoiced": round(dir_inv_net, 2),
            "backlog": round(dir_out_back, 2),
            "pct": direct_pct,
            "variance": round(direct_variance, 2),
        },
        "dis_pri": {
            "target": round(pri_target, 2),
            "actual": round(pri_actual, 2),
            "invoiced": round(dis_pri_inv, 2),
            "backlog": round(dis_pri_back, 2),
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
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    backlog_mode: Optional[str] = Query("with")
):
    df_info = resolve_date_filter(month, date, start_date, end_date)
    selected_month = df_info["selected_month"]
    month_num = df_info["month_num"]
    year = df_info["year"]
    days_in_month = df_info["days_in_month"]
    filter_start = df_info["filter_start"]
    filter_end = df_info["filter_end"]
    days_count = df_info["days_count"]
    has_date_filter = filter_start is not None
    mode = backlog_mode.lower().strip() if backlog_mode and backlog_mode.lower().strip() in ["with", "without", "only"] else "with"

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # 1. Primary Sales Details (cust_grp = 'DISTRI')
        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(net_dom_amount), 0) as dis_inv 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s 
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (month_num, year))
        pri_inv = float(cursor.fetchone()['dis_inv'] or 0.0)

        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dis_back 
                FROM outstanding_output 
                WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """, (filter_start, filter_end))
        else:
            cursor.execute("""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as dis_back 
                FROM outstanding_output 
                WHERE UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL);
            """)
        pri_back = float(cursor.fetchone()['dis_back'] or 0.0)

        if mode == "without":
            pri_actual = pri_inv
        elif mode == "only":
            pri_actual = pri_back
        else:
            pri_actual = pri_inv + pri_back

        cursor.execute("""
            SELECT COALESCE(SUM(primary_target), 0) as pri_target 
            FROM dis_budget 
            WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
        """, (month_num, f"%-{month_num:02d}-%", selected_month))
        monthly_pri_target = float(cursor.fetchone()['pri_target'] or 0.0)
        pri_target = (monthly_pri_target / days_in_month * days_count) if has_date_filter else monthly_pri_target

        pri_pct = round((pri_actual / pri_target) * 100) if pri_target > 0 else 0
        pri_variance = pri_actual - pri_target

        # 2. RD Sales Details (axienta_data.value)
        if has_date_filter:
            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as rd_act 
                FROM axienta_data 
                WHERE DATE(entry_date) >= %s AND DATE(entry_date) <= %s;
            """, (filter_start, filter_end))
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
        rd_target = (monthly_rd_target / days_in_month * days_count) if has_date_filter else monthly_rd_target

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

        if mode == "without":
            fy_pri_actual = fy_pri_inv
        elif mode == "only":
            fy_pri_actual = pri_back
        else:
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

            if mode == "without":
                m_pri_act = m_pri_inv
            elif mode == "only":
                m_pri_act = (pri_back if m_code == month_num else 0.0)
            else:
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

    return {
        "selected_month": selected_month,
        "selected_date": filter_start if df_info["is_single"] else None,
        "start_date": filter_start,
        "end_date": filter_end,
        "days_count": days_count,
        "month_label": df_info["label"],
        "backlog_mode": mode,
        "primary_sales": {
            "actual": round(pri_actual, 2),
            "target": round(pri_target, 2),
            "invoiced": round(pri_inv, 2),
            "backlog": round(pri_back, 2),
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
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    backlog_mode: Optional[str] = Query("with")
):
    b_mode = (backlog_mode or "with").lower().strip()
    if b_mode not in ["with", "without", "only"]:
        b_mode = "with"
    df_info = resolve_date_filter(month, date, start_date, end_date)
    selected_month = df_info["selected_month"]
    month_num = df_info["month_num"]
    year = df_info["year"]
    days_in_month = df_info["days_in_month"]
    filter_start = df_info["filter_start"]
    filter_end = df_info["filter_end"]
    days_count = df_info["days_count"]
    has_date_filter = filter_start is not None

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
                'm_pri_tgt': (m_pri / days_in_month * days_count) if has_date_filter else m_pri,
                'm_rd_tgt': (m_rd / days_in_month * days_count) if has_date_filter else m_rd
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
        if has_date_filter:
            cursor.execute("""
                SELECT 
                    TRIM(product_id) as pid,
                    COALESCE(SUM(value), 0) as m_rd_act
                FROM axienta_data
                WHERE DATE(entry_date) >= %s AND DATE(entry_date) <= %s
                GROUP BY TRIM(product_id);
            """, (filter_start, filter_end))
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
        if has_date_filter:
            cursor.execute("""
                SELECT 
                    TRIM(catalog_no) as pid,
                    COALESCE(SUM(net_dom_amount), 0) as m_inv
                FROM invoice_output
                WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
                GROUP BY TRIM(catalog_no);
            """, (filter_start, filter_end))
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
        if has_date_filter:
            cursor.execute("""
                SELECT 
                    TRIM(catalog_no) as pid,
                    COALESCE(SUM(backlog_value_base_curr), 0) as back
                FROM outstanding_output
                WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s
                  AND UPPER(TRIM(cust_grp)) = 'DISTRI'
                  AND (UPPER(TRIM(contract)) != 'GSTEA' OR contract IS NULL)
                GROUP BY TRIM(catalog_no);
            """, (filter_start, filter_end))
        else:
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

        # Helper to compute safe percentage
        def calc_pct(act, tgt):
            if tgt and tgt > 0:
                return round((act / tgt) * 100, 1)
            return 0.0

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
            
            m_inv_val = float(inv_m_map.get(pno, 0.0))
            c_inv_val = float(inv_c_map.get(pno, 0.0))
            b_val = float(back_map.get(pno, 0.0))
            
            if b_mode == "without":
                item_pri_act = m_inv_val
                item_c_pri_act = c_inv_val
            elif b_mode == "only":
                item_pri_act = b_val
                item_c_pri_act = b_val
            else:  # "with"
                item_pri_act = m_inv_val + b_val
                item_c_pri_act = c_inv_val + b_val

            item_rd_act = float(axienta_m_map.get(pno, 0.0))

            item_c_pri_tgt = float(b_c_info.get('c_pri_tgt', 0.0))
            item_c_rd_tgt = float(b_c_info.get('c_rd_tgt', 0.0))
            item_c_rd_act = float(axienta_c_map.get(pno, 0.0))

            item_obj = {
                "part_no": pno,
                "product_sku": psku,
                "p_tgt": round(item_pri_tgt, 2),
                "p_act": round(item_pri_act, 2),
                "p_pct": calc_pct(item_pri_act, item_pri_tgt),
                "rd_tgt": round(item_rd_tgt, 2),
                "rd_act": round(item_rd_act, 2),
                "rd_pct": calc_pct(item_rd_act, item_rd_tgt),
                "c_p_tgt": round(item_c_pri_tgt, 2),
                "c_p_act": round(item_c_pri_act, 2),
                "c_p_pct": calc_pct(item_c_pri_act, item_c_pri_tgt),
                "c_rd_tgt": round(item_c_rd_tgt, 2),
                "c_rd_act": round(item_c_rd_act, 2),
                "c_rd_pct": calc_pct(item_c_rd_act, item_c_rd_tgt),
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
                s_pri_tgt = sum(i['p_tgt'] for i in items)
                s_pri_act = sum(i['p_act'] for i in items)
                s_rd_tgt = sum(i['rd_tgt'] for i in items)
                s_rd_act = sum(i['rd_act'] for i in items)

                s_c_pri_tgt = sum(i['c_p_tgt'] for i in items)
                s_c_pri_act = sum(i['c_p_act'] for i in items)
                s_c_rd_tgt = sum(i['c_rd_tgt'] for i in items)
                s_c_rd_act = sum(i['c_rd_act'] for i in items)

                sub_list.append({
                    "subgroup_name": sub_name,
                    "p_tgt": round(s_pri_tgt, 2),
                    "p_act": round(s_pri_act, 2),
                    "p_pct": calc_pct(s_pri_act, s_pri_tgt),
                    "rd_tgt": round(s_rd_tgt, 2),
                    "rd_act": round(s_rd_act, 2),
                    "rd_pct": calc_pct(s_rd_act, s_rd_tgt),
                    "c_p_tgt": round(s_c_pri_tgt, 2),
                    "c_p_act": round(s_c_pri_act, 2),
                    "c_p_pct": calc_pct(s_c_pri_act, s_c_pri_tgt),
                    "c_rd_tgt": round(s_c_rd_tgt, 2),
                    "c_rd_act": round(s_c_rd_act, 2),
                    "c_rd_pct": calc_pct(s_c_rd_act, s_c_rd_tgt),
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
                "p_tgt": round(div_pri_tgt, 2),
                "p_act": round(div_pri_act, 2),
                "p_pct": calc_pct(div_pri_act, div_pri_tgt),
                "rd_tgt": round(div_rd_tgt, 2),
                "rd_act": round(div_rd_act, 2),
                "rd_pct": calc_pct(div_rd_act, div_rd_tgt),
                "c_p_tgt": round(div_c_pri_tgt, 2),
                "c_p_act": round(div_c_pri_act, 2),
                "c_p_pct": calc_pct(div_c_pri_act, div_c_pri_tgt),
                "c_rd_tgt": round(div_c_rd_tgt, 2),
                "c_rd_act": round(div_c_rd_act, 2),
                "c_rd_pct": calc_pct(div_c_rd_act, div_c_rd_tgt),
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

    return {
        "selected_month": selected_month,
        "selected_date": filter_start if df_info["is_single"] else None,
        "start_date": filter_start,
        "end_date": filter_end,
        "days_count": days_count,
        "month_label": df_info["label"],
        "grand_total": {
            "p_tgt": round(g_pri_tgt, 2),
            "p_act": round(g_pri_act, 2),
            "p_pct": calc_pct(g_pri_act, g_pri_tgt),
            "rd_tgt": round(g_rd_tgt, 2),
            "rd_act": round(g_rd_act, 2),
            "rd_pct": calc_pct(g_rd_act, g_rd_tgt),
            "c_p_tgt": round(g_c_pri_tgt, 2),
            "c_p_act": round(g_c_pri_act, 2),
            "c_p_pct": calc_pct(g_c_pri_act, g_c_pri_tgt),
            "c_rd_tgt": round(g_c_rd_tgt, 2),
            "c_rd_act": round(g_c_rd_act, 2),
            "c_rd_pct": calc_pct(g_c_rd_act, g_c_rd_tgt),
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
