import calendar
from datetime import datetime
from typing import Optional, Dict, Any, List
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


# ─── CONTRACTS LIST ENDPOINT ───
@router.get("/contracts")
def get_contracts():
    """Return all distinct non-null contract codes from invoices and outstanding orders."""
    conn = get_db_connection()
    with conn.cursor() as cursor:
        cursor.execute("""
            SELECT DISTINCT TRIM(contract) as contract 
            FROM invoice_output 
            WHERE contract IS NOT NULL AND TRIM(contract) != ''
            UNION
            SELECT DISTINCT TRIM(contract) as contract 
            FROM outstanding_output 
            WHERE contract IS NOT NULL AND TRIM(contract) != ''
            ORDER BY contract ASC;
        """)
        rows = cursor.fetchall()
        contracts = [r['contract'] for r in rows if r.get('contract')]
    conn.close()
    return {"contracts": contracts}


def calc_pct(act, tgt):
    if tgt and tgt > 0:
        return round((act / tgt) * 100, 1)
    return 0.0


# ─── CORE DISTRI RANGE CALCULATION ENGINE ───
def compute_distri_range_dataset(
    month: str = "july",
    date: Optional[str] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    backlog_mode: str = "without",
    contracts: Optional[str] = None
) -> Dict[str, Any]:
    b_mode = (backlog_mode or "without").lower().strip()
    if b_mode not in ["with", "without", "only"]:
        b_mode = "without"

    df_info = resolve_date_filter(month, date, start_date, end_date)
    selected_month = df_info["selected_month"]
    month_num = df_info["month_num"]
    year = df_info["year"]
    days_in_month = df_info["days_in_month"]
    filter_start = df_info["filter_start"]
    filter_end = df_info["filter_end"]
    days_count = df_info["days_count"]
    has_date_filter = filter_start is not None

    contract_list = []
    if isinstance(contracts, str) and contracts.strip():
        contract_list = [c.strip().upper() for c in contracts.split(",") if c.strip()]

    if contract_list:
        placeholders = ', '.join(['%s'] * len(contract_list))
        c_clause = f"AND UPPER(TRIM(contract)) IN ({placeholders})"
        c_params = list(contract_list)
    else:
        c_clause = "AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS', 'MIL', 'MTL') OR contract IS NULL)"
        c_params = []

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Division mappings for sales_group -> range_name, match_type, contract_code (Visible on Distri Range FY)
        contract_to_range = {}
        contract_to_sg = {}
        cursor.execute("""
            SELECT TRIM(sales_group) as sg, TRIM(range_name) as rn,
                   UPPER(TRIM(COALESCE(match_type, 'CATALOG_GROUP'))) as m_type,
                   UPPER(TRIM(COALESCE(contract_code, ''))) as c_code
            FROM division_mappings 
            WHERE range_name IS NOT NULL AND range_name != 'Range'
              AND (visibility IS NULL OR visibility = '' OR visibility = 'both' OR visibility = 'distri_range');
        """)
        sg_to_range = {}
        range_to_sgs = {}
        for r in cursor.fetchall():
            sg_val = r.get('sg')
            rn_val = r.get('rn')
            m_type = r.get('m_type')
            c_code = r.get('c_code')
            if sg_val and rn_val:
                s_clean = sg_val.strip()
                r_clean = rn_val.strip()
                sg_to_range[s_clean.lower()] = r_clean
                if r_clean not in range_to_sgs:
                    range_to_sgs[r_clean] = set()
                range_to_sgs[r_clean].add(s_clean)
                if m_type == 'CONTRACT' and c_code:
                    contract_to_range[c_code.lower()] = r_clean
                    contract_to_sg[c_code.lower()] = s_clean

        # Official distinct Division / Range names (Visible on Distri Range FY)
        cursor.execute("""
            SELECT DISTINCT TRIM(range_name) as rn 
            FROM division_mappings 
            WHERE range_name IS NOT NULL AND TRIM(range_name) != '' AND range_name != 'Range'
              AND (visibility IS NULL OR visibility = '' OR visibility = 'both' OR visibility = 'distri_range')
            UNION
            SELECT DISTINCT TRIM(b.range_name) as rn
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            WHERE b.range_name IS NOT NULL AND TRIM(b.range_name) != '' AND b.range_name != 'Range'
              AND (m.visibility IS NULL OR m.visibility = '' OR m.visibility = 'both' OR m.visibility = 'distri_range');
        """)
        official_ranges = sorted([r['rn'] for r in cursor.fetchall() if r.get('rn')])

        # All distinct items from total_budget (Visible on Distri Range FY)
        cursor.execute("""
            SELECT DISTINCT
                TRIM(b.range_name) as division_name,
                TRIM(b.sales_group) as subgroup_name,
                TRIM(b.part_no) as part_no,
                TRIM(b.product_sku) as product_sku
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            WHERE b.range_name IS NOT NULL AND TRIM(b.range_name) != ''
              AND b.sales_group IS NOT NULL AND TRIM(b.sales_group) != ''
              AND (m.visibility IS NULL OR m.visibility = '' OR m.visibility = 'both' OR m.visibility = 'distri_range');
        """)
        tb_items = cursor.fetchall()
        part_to_div = {}
        for r in tb_items:
            if r.get('part_no'):
                part_to_div[r['part_no'].strip().lower()] = (r['division_name'] or '', r['subgroup_name'] or '', r['product_sku'] or '')

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
        axienta_m_map = {r['pid']: float(r['m_rd_act'] or 0.0) for r in cursor.fetchall()}

        # 4. Cumulative RD actual from axienta_data
        cursor.execute("""
            SELECT 
                TRIM(product_id) as pid,
                COALESCE(SUM(value), 0) as c_rd_act
            FROM axienta_data
            WHERE MONTH(entry_date) <= %s AND YEAR(entry_date) = %s
            GROUP BY TRIM(product_id);
        """, (month_num, year))
        axienta_c_map = {r['pid']: float(r['c_rd_act'] or 0.0) for r in cursor.fetchall()}

        # 5. Primary actual from invoice_output
        c_list = list(contract_to_range.keys())
        c_filter_sql = f"OR LOWER(TRIM(contract)) IN ({','.join(['%s']*len(c_list))})" if c_list else ""
        if has_date_filter:
            cursor.execute(f"""
                SELECT 
                    TRIM(catalog_no) as pid,
                    UPPER(TRIM(COALESCE(contract, ''))) as contract_code,
                    TRIM(COALESCE(catalog_group, '')) as sg,
                    COALESCE(SUM(net_dom_amount), 0) as m_inv
                FROM invoice_output
                WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s
                  AND (UPPER(TRIM(cust_grp)) = 'DISTRI' {c_filter_sql}) {c_clause}
                GROUP BY TRIM(catalog_no), UPPER(TRIM(COALESCE(contract, ''))), TRIM(COALESCE(catalog_group, ''));
            """, [filter_start, filter_end] + c_list + c_params)
        else:
            cursor.execute(f"""
                SELECT 
                    TRIM(catalog_no) as pid,
                    UPPER(TRIM(COALESCE(contract, ''))) as contract_code,
                    TRIM(COALESCE(catalog_group, '')) as sg,
                    COALESCE(SUM(net_dom_amount), 0) as m_inv
                FROM invoice_output
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s
                  AND (UPPER(TRIM(cust_grp)) = 'DISTRI' {c_filter_sql}) {c_clause}
                GROUP BY TRIM(catalog_no), UPPER(TRIM(COALESCE(contract, ''))), TRIM(COALESCE(catalog_group, ''));
            """, [month_num, year] + c_list + c_params)
        inv_m_map = {}
        for r in cursor.fetchall():
            p_no = r['pid']
            c_val = r['contract_code'].lower()
            sg_val = r['sg']
            amt = float(r['m_inv'] or 0.0)
            if c_val in contract_to_range:
                d_name = contract_to_range[c_val]
                s_name = contract_to_sg.get(c_val, sg_val or 'General')
            elif sg_val.lower() in sg_to_range:
                d_name = sg_to_range[sg_val.lower()]
                s_name = sg_val
            elif p_no.lower() in part_to_div:
                d_name, s_name, _ = part_to_div[p_no.lower()]
            elif sg_val in official_ranges:
                d_name = sg_val
                s_name = sg_val
            else:
                continue

            if d_name and d_name in official_ranges:
                inv_m_map[(d_name, s_name, p_no)] = inv_m_map.get((d_name, s_name, p_no), 0.0) + amt

        # 6. Cumulative Primary actual from invoice_output
        cursor.execute(f"""
            SELECT 
                TRIM(catalog_no) as pid,
                UPPER(TRIM(COALESCE(contract, ''))) as contract_code,
                TRIM(COALESCE(catalog_group, '')) as sg,
                COALESCE(SUM(net_dom_amount), 0) as c_inv
            FROM invoice_output
            WHERE MONTH(invoice_date) <= %s AND YEAR(invoice_date) = %s
              AND (UPPER(TRIM(cust_grp)) = 'DISTRI' {c_filter_sql}) {c_clause}
            GROUP BY TRIM(catalog_no), UPPER(TRIM(COALESCE(contract, ''))), TRIM(COALESCE(catalog_group, ''));
        """, [month_num, year] + c_list + c_params)
        inv_c_map = {}
        for r in cursor.fetchall():
            p_no = r['pid']
            c_val = r['contract_code'].lower()
            sg_val = r['sg']
            amt = float(r['c_inv'] or 0.0)
            if c_val in contract_to_range:
                d_name = contract_to_range[c_val]
                s_name = contract_to_sg.get(c_val, sg_val or 'General')
            elif sg_val.lower() in sg_to_range:
                d_name = sg_to_range[sg_val.lower()]
                s_name = sg_val
            elif p_no.lower() in part_to_div:
                d_name, s_name, _ = part_to_div[p_no.lower()]
            elif sg_val in official_ranges:
                d_name = sg_val
                s_name = sg_val
            else:
                continue

            if d_name and d_name in official_ranges:
                inv_c_map[(d_name, s_name, p_no)] = inv_c_map.get((d_name, s_name, p_no), 0.0) + amt

        # 7. Backlog from outstanding_output (Only Reserved Orders)
        if has_date_filter:
            cursor.execute(f"""
                SELECT 
                    TRIM(catalog_no) as pid,
                    UPPER(TRIM(COALESCE(contract, ''))) as contract_code,
                    TRIM(COALESCE(catalog_group, '')) as sg,
                    COALESCE(SUM(backlog_value_base_curr), 0) as back
                FROM outstanding_output
                WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s
                  AND UPPER(TRIM(COALESCE(line_state, ''))) = 'RESERVED'
                  AND (UPPER(TRIM(cust_grp)) = 'DISTRI' {c_filter_sql}) {c_clause}
                GROUP BY TRIM(catalog_no), UPPER(TRIM(COALESCE(contract, ''))), TRIM(COALESCE(catalog_group, ''));
            """, [filter_start, filter_end] + c_list + c_params)
        else:
            cursor.execute(f"""
                SELECT 
                    TRIM(catalog_no) as pid,
                    UPPER(TRIM(COALESCE(contract, ''))) as contract_code,
                    TRIM(COALESCE(catalog_group, '')) as sg,
                    COALESCE(SUM(backlog_value_base_curr), 0) as back
                FROM outstanding_output
                WHERE UPPER(TRIM(COALESCE(line_state, ''))) = 'RESERVED'
                  AND (UPPER(TRIM(cust_grp)) = 'DISTRI' {c_filter_sql}) {c_clause}
                GROUP BY TRIM(catalog_no), UPPER(TRIM(COALESCE(contract, ''))), TRIM(COALESCE(catalog_group, ''));
            """, c_list + c_params if c_list else c_params)
        back_map = {}
        for r in cursor.fetchall():
            p_no = r['pid']
            c_val = r['contract_code'].lower()
            sg_val = r['sg']
            amt = float(r['back'] or 0.0)
            if c_val in contract_to_range:
                d_name = contract_to_range[c_val]
                s_name = contract_to_sg.get(c_val, sg_val or 'General')
            elif sg_val.lower() in sg_to_range:
                d_name = sg_to_range[sg_val.lower()]
                s_name = sg_val
            elif p_no.lower() in part_to_div:
                d_name, s_name, _ = part_to_div[p_no.lower()]
            elif sg_val in official_ranges:
                d_name = sg_val
                s_name = sg_val
            else:
                continue

            if d_name and d_name in official_ranges:
                back_map[(d_name, s_name, p_no)] = back_map.get((d_name, s_name, p_no), 0.0) + amt

        cursor.execute(f"""
            SELECT DISTINCT TRIM(catalog_no) as part_no, TRIM(description) as product_sku, 
                            TRIM(catalog_group) as sg, UPPER(TRIM(contract)) as contract
            FROM invoice_output
            WHERE (UPPER(TRIM(cust_grp)) = 'DISTRI' OR LOWER(TRIM(contract)) IN ({','.join(['%s']*len(contract_to_range)) if contract_to_range else "''"}))
              AND catalog_no IS NOT NULL AND TRIM(catalog_no) != '';
        """, list(contract_to_range.keys()) if contract_to_range else [])
        inv_items = cursor.fetchall()

        cursor.execute(f"""
            SELECT DISTINCT TRIM(catalog_no) as part_no, TRIM(catalog_desc) as product_sku, 
                            TRIM(catalog_group) as sg, UPPER(TRIM(contract)) as contract
            FROM outstanding_output
            WHERE UPPER(TRIM(COALESCE(line_state, ''))) = 'RESERVED'
              AND (UPPER(TRIM(cust_grp)) = 'DISTRI' OR LOWER(TRIM(contract)) IN ({','.join(['%s']*len(contract_to_range)) if contract_to_range else "''"}))
              AND catalog_no IS NOT NULL AND TRIM(catalog_no) != '';
        """, list(contract_to_range.keys()) if contract_to_range else [])
        out_items = cursor.fetchall()

        all_merged_items = {}
        for r in tb_items:
            if r.get('part_no'):
                pno = r['part_no'].strip()
                div_name = r['division_name']
                sub_name = r['subgroup_name'] or 'General'
                psku = r['product_sku'] or pno
                if div_name and div_name in official_ranges:
                    all_merged_items[(div_name, sub_name, pno)] = psku

        for rn in official_ranges:
            sgs = range_to_sgs.get(rn, set())
            for sg in sgs:
                key = (rn, sg, 'nan')
                if key not in all_merged_items:
                    all_merged_items[key] = sg

        for r in inv_items:
            pno = (r.get('part_no') or '').strip()
            if not pno:
                continue
            sg = (r.get('sg') or '').strip()
            c_code = (r.get('contract') or '').strip().lower()

            if c_code and c_code in contract_to_range:
                div_name = contract_to_range[c_code]
                sub_name = contract_to_sg.get(c_code, sg or 'General')
            elif sg.lower() in sg_to_range:
                div_name = sg_to_range[sg.lower()]
                sub_name = sg
            elif pno.lower() in part_to_div:
                div_name, sub_name, _ = part_to_div[pno.lower()]
            elif sg in official_ranges:
                div_name = sg
                sub_name = sg
            else:
                continue

            if not div_name or div_name not in official_ranges:
                continue

            sku = (r.get('product_sku') or '').strip() or pno
            key = (div_name, sub_name, pno)
            if key not in all_merged_items:
                all_merged_items[key] = sku

        for r in out_items:
            pno = (r.get('part_no') or '').strip()
            if not pno:
                continue
            sg = (r.get('sg') or '').strip()
            c_code = (r.get('contract') or '').strip().lower()

            if c_code and c_code in contract_to_range:
                div_name = contract_to_range[c_code]
                sub_name = contract_to_sg.get(c_code, sg or 'General')
            elif sg.lower() in sg_to_range:
                div_name = sg_to_range[sg.lower()]
                sub_name = sg
            elif pno.lower() in part_to_div:
                div_name, sub_name, _ = part_to_div[pno.lower()]
            elif sg in official_ranges:
                div_name = sg
                sub_name = sg
            else:
                continue

            if not div_name or div_name not in official_ranges:
                continue

            sku = (r.get('product_sku') or '').strip() or pno
            key = (div_name, sub_name, pno)
            if key not in all_merged_items:
                all_merged_items[key] = sku

        # Build hierarchy tree for all official divisions
        divisions = {rn: {} for rn in official_ranges}
        g_pri_tgt = g_pri_act = g_rd_tgt = g_rd_act = 0.0
        g_c_pri_tgt = g_c_pri_act = g_c_rd_tgt = g_c_rd_act = 0.0
        g_inv = g_back = 0.0

        for (div_name, sub_name, pno), psku in sorted(all_merged_items.items(), key=lambda x: (x[0][0], x[0][1], x[0][2])):
            b_info = dis_budget_map.get(pno, {})
            b_c_info = dis_budget_c_map.get(pno, {})

            item_pri_tgt = float(b_info.get('m_pri_tgt', 0.0))
            item_rd_tgt = float(b_info.get('m_rd_tgt', 0.0))
            
            m_inv_val = float(inv_m_map.get((div_name, sub_name, pno), 0.0))
            c_inv_val = float(inv_c_map.get((div_name, sub_name, pno), 0.0))
            b_val = float(back_map.get((div_name, sub_name, pno), 0.0))

            g_inv += m_inv_val
            g_back += b_val

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
                continue
            if sub_name not in divisions[div_name]:
                divisions[div_name][sub_name] = []
            divisions[div_name][sub_name].append(item_obj)

        tree = []
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

        # 12-Month Breakdown Calculation (Consistent with Division Mappings)
        monthly_breakdown = []
        for m_key, m_code in MONTH_MAPPING.items():
            m_yr = 2027 if m_code in [1, 2, 3] else 2026
            
            # Monthly Invoiced for visible distri items
            cursor.execute(f"""
                SELECT TRIM(catalog_no) as pid, UPPER(TRIM(COALESCE(contract, ''))) as contract_code,
                       TRIM(COALESCE(catalog_group, '')) as sg, COALESCE(SUM(net_dom_amount), 0) as m_inv
                FROM invoice_output
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s
                  AND (UPPER(TRIM(cust_grp)) = 'DISTRI' {c_filter_sql}) {c_clause}
                GROUP BY TRIM(catalog_no), UPPER(TRIM(COALESCE(contract, ''))), TRIM(COALESCE(catalog_group, ''));
            """, [m_code, m_yr] + c_list + c_params)
            m_inv_tot = 0.0
            for r in cursor.fetchall():
                p_no = r['pid']
                c_val = r['contract_code'].lower()
                sg_val = r['sg']
                amt = float(r['m_inv'] or 0.0)
                d_name = None
                if c_val in contract_to_range:
                    d_name = contract_to_range[c_val]
                elif sg_val.lower() in sg_to_range:
                    d_name = sg_to_range[sg_val.lower()]
                elif p_no.lower() in part_to_div:
                    d_name, _, _ = part_to_div[p_no.lower()]
                elif sg_val in official_ranges:
                    d_name = sg_val

                if d_name and d_name in official_ranges:
                    m_inv_tot += amt

            if b_mode == "without":
                m_pri_act = m_inv_tot
            elif b_mode == "only":
                m_pri_act = (g_back if m_code == month_num else 0.0)
            else:
                m_pri_act = m_inv_tot + (g_back if m_code == month_num else 0.0)

            # Monthly target from dis_budget for items in visible official ranges
            if official_ranges:
                placeholders = ','.join(['%s'] * len(official_ranges))
                cursor.execute(f"""
                    SELECT COALESCE(SUM(primary_target), 0) as tgt, COALESCE(SUM(rd_target), 0) as rd_tgt 
                    FROM dis_budget 
                    WHERE (MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s)
                      AND TRIM(division_name) IN ({placeholders});
                """, [m_code, f"%-{m_code:02d}-%", m_key] + official_ranges)
            else:
                cursor.execute("""
                    SELECT COALESCE(SUM(primary_target), 0) as tgt, COALESCE(SUM(rd_target), 0) as rd_tgt 
                    FROM dis_budget 
                    WHERE MONTH(month) = %s OR month LIKE %s OR LOWER(month) = %s;
                """, (m_code, f"%-{m_code:02d}-%", m_key))
            tgt_row = cursor.fetchone()
            m_pri_tgt = float(tgt_row['tgt'] or 0.0)
            m_rd_tgt = float(tgt_row['rd_tgt'] or 0.0)

            cursor.execute("""
                SELECT COALESCE(SUM(value), 0) as val 
                FROM axienta_data 
                WHERE MONTH(entry_date) = %s AND YEAR(entry_date) = %s;
            """, (m_code, m_yr))
            m_rd_act = float(cursor.fetchone()['val'] or 0.0)

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
        "df_info": df_info,
        "selected_month": selected_month,
        "selected_date": filter_start if df_info["is_single"] else None,
        "start_date": filter_start,
        "end_date": filter_end,
        "days_count": days_count,
        "month_label": df_info["label"],
        "backlog_mode": b_mode,
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
        "invoiced": round(g_inv, 2),
        "backlog": round(g_back, 2),
        "tree": tree,
        "divisions_count": len(tree),
        "monthly_breakdown": monthly_breakdown
    }


# ─── DISTRI RANGE WISE FY API ENDPOINT ───
@router.get("/distri-range-fy")
def get_distri_range_fy(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    backlog_mode: Optional[str] = Query("without"),
    contracts: Optional[str] = Query(None)
):
    dataset = compute_distri_range_dataset(
        month=month or "july",
        date=date,
        start_date=start_date,
        end_date=end_date,
        backlog_mode=backlog_mode or "without",
        contracts=contracts
    )
    return {
        "selected_month": dataset["selected_month"],
        "selected_date": dataset["selected_date"],
        "start_date": dataset["start_date"],
        "end_date": dataset["end_date"],
        "days_count": dataset["days_count"],
        "month_label": dataset["month_label"],
        "grand_total": dataset["grand_total"],
        "tree": dataset["tree"]
    }


# ─── DIS DASHBOARD FY OVERVIEW ENDPOINT ───
@router.get("/dis-dashboard-fy-overview")
def get_dis_dashboard_fy_overview(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    backlog_mode: Optional[str] = Query("without"),
    contracts: Optional[str] = Query(None)
):
    dataset = compute_distri_range_dataset(
        month=month or "july",
        date=date,
        start_date=start_date,
        end_date=end_date,
        backlog_mode=backlog_mode or "without",
        contracts=contracts
    )
    gt = dataset["grand_total"]
    pri_actual = gt["pri_actual"]
    pri_target = gt["pri_target"]
    pri_pct = int(round(gt["p_pct"]))
    pri_variance = round(pri_actual - pri_target, 2)

    rd_actual = gt["rd_actual"]
    rd_target = gt["rd_target"]
    rd_pct = int(round(gt["rd_pct"]))
    rd_variance = round(rd_actual - rd_target, 2)

    mb = dataset.get("monthly_breakdown", [])
    fy_pri_target = sum(m["pri_tgt"] for m in mb)
    fy_pri_actual = sum(m["pri_act"] for m in mb)
    fy_pri_pct = int(round((fy_pri_actual / fy_pri_target) * 100)) if fy_pri_target > 0 else 0

    fy_rd_target = sum(m["rd_tgt"] for m in mb)
    fy_rd_actual = sum(m["rd_act"] for m in mb)
    fy_rd_pct = int(round((fy_rd_actual / fy_rd_target) * 100)) if fy_rd_target > 0 else 0

    return {
        "selected_month": dataset["selected_month"],
        "selected_date": dataset["selected_date"],
        "start_date": dataset["start_date"],
        "end_date": dataset["end_date"],
        "days_count": dataset["days_count"],
        "month_label": dataset["month_label"],
        "backlog_mode": dataset["backlog_mode"],
        "primary_sales": {
            "actual": pri_actual,
            "target": pri_target,
            "invoiced": dataset["invoiced"],
            "backlog": dataset["backlog"],
            "pct": pri_pct,
            "variance": pri_variance,
        },
        "rd_sales": {
            "actual": rd_actual,
            "target": rd_target,
            "pct": rd_pct,
            "variance": rd_variance,
        },
        "full_year": {
            "pri_target": round(fy_pri_target, 2),
            "pri_actual": round(fy_pri_actual, 2),
            "pri_pct": fy_pri_pct,
            "rd_target": round(fy_rd_target, 2),
            "rd_actual": round(fy_rd_actual, 2),
            "rd_pct": fy_rd_pct
        },
        "monthly_breakdown": dataset["monthly_breakdown"]
    }


# ─── TOTAL COMPANY DASHBOARD FY OVERVIEW ENDPOINT ───
@router.get("/dashboard-fy-overview")
def get_dashboard_fy_overview(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    backlog_mode: Optional[str] = Query("without"),
    contracts: Optional[str] = Query(None)
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
    mode = (backlog_mode or "without").lower().strip()
    if mode not in ["with", "without", "only"]:
        mode = "without"

    # 1. Obtain Distributor Primary and RD metrics from the unified calculation
    dis_dataset = compute_distri_range_dataset(
        month=month or "july",
        date=date,
        start_date=start_date,
        end_date=end_date,
        backlog_mode=mode,
        contracts=contracts
    )
    dis_gt = dis_dataset["grand_total"]
    dis_pri_target = dis_gt["pri_target"]
    dis_pri_actual = dis_gt["pri_actual"]
    dis_pri_inv = dis_dataset["invoiced"]
    dis_pri_back = dis_dataset["backlog"]
    dis_pri_pct = int(round(dis_gt["p_pct"]))
    dis_pri_variance = round(dis_pri_actual - dis_pri_target, 2)

    dis_rd_target = dis_gt["rd_target"]
    dis_rd_actual = dis_gt["rd_actual"]
    dis_rd_pct = int(round(dis_gt["rd_pct"]))
    dis_rd_variance = round(dis_rd_actual - dis_rd_target, 2)

    # 2. Total Budget Calculation (Visible on Total Range FY)
    contract_list = []
    if isinstance(contracts, str) and contracts.strip():
        contract_list = [c.strip().upper() for c in contracts.split(",") if c.strip()]

    if contract_list:
        placeholders = ', '.join(['%s'] * len(contract_list))
        c_clause = f"AND UPPER(TRIM(contract)) IN ({placeholders})"
        c_params = list(contract_list)
    else:
        c_clause = "AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL)"
        c_params = []

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # Total Budget monthly target for items visible on total_range
        cursor.execute(f"""
            SELECT COALESCE(SUM(b.{selected_month}), 0) as target, COALESCE(SUM(b.total), 0) as annual_target 
            FROM total_budget b
            LEFT JOIN division_mappings m ON LOWER(TRIM(b.sales_group)) = LOWER(TRIM(m.sales_group))
            WHERE (m.visibility IS NULL OR m.visibility = '' OR m.visibility = 'both' OR m.visibility = 'total_range');
        """)
        tb_target_row = cursor.fetchone()
        monthly_total_target = float(tb_target_row['target'] or 0.0)
        annual_target = float(tb_target_row['annual_target'] or 0.0)
        total_target_val = (monthly_total_target / days_in_month * days_count) if has_date_filter else monthly_total_target

        # Invoiced Net Amount for items visible on total_range
        if has_date_filter:
            cursor.execute(f"""
                SELECT COALESCE(SUM(net_dom_amount), 0) as inv_net 
                FROM invoice_output 
                WHERE DATE(invoice_date) >= %s AND DATE(invoice_date) <= %s {c_clause};
            """, [filter_start, filter_end] + c_params)
        else:
            cursor.execute(f"""
                SELECT COALESCE(SUM(net_dom_amount), 0) as inv_net 
                FROM invoice_output 
                WHERE MONTH(invoice_date) = %s AND YEAR(invoice_date) = %s {c_clause};
            """, [month_num, year] + c_params)
        inv_net = float(cursor.fetchone()['inv_net'] or 0.0)

        # Backlog value for items visible on total_range (Only Reserved Orders)
        if has_date_filter:
            cursor.execute(f"""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back_val 
                FROM outstanding_output 
                WHERE DATE(planned_delivery_date) >= %s AND DATE(planned_delivery_date) <= %s
                  AND UPPER(TRIM(COALESCE(line_state, ''))) = 'RESERVED' {c_clause};
            """, [filter_start, filter_end] + c_params)
        else:
            cursor.execute(f"""
                SELECT COALESCE(SUM(backlog_value_base_curr), 0) as back_val 
                FROM outstanding_output 
                WHERE UPPER(TRIM(COALESCE(line_state, ''))) = 'RESERVED' {c_clause};
            """, c_params)
        out_back_val = float(cursor.fetchone()['back_val'] or 0.0)

        # Full Fiscal Year 2026/2027 Invoiced (April 2026 - March 2027) for Annual Budget vs Actual
        cursor.execute(f"""
            SELECT COALESCE(SUM(net_dom_amount), 0) as fy_inv 
            FROM invoice_output 
            WHERE (
                (YEAR(invoice_date) = 2026 AND MONTH(invoice_date) >= 4) OR
                (YEAR(invoice_date) = 2027 AND MONTH(invoice_date) <= 3)
            ) {c_clause};
        """, c_params)
        fy_inv_net = float(cursor.fetchone()['fy_inv'] or 0.0)

    conn.close()

    if mode == "without":
        total_actual_val = inv_net
        fy_actual_val = fy_inv_net
    elif mode == "only":
        total_actual_val = out_back_val
        fy_actual_val = out_back_val
    else:
        total_actual_val = inv_net + out_back_val
        fy_actual_val = fy_inv_net + out_back_val

    total_pct = int(round((total_actual_val / total_target_val) * 100)) if total_target_val > 0 else 0
    total_variance = round(total_actual_val - total_target_val, 2)

    # 3. DIRECT BUDGET vs ACTUAL – CURRENT MONTH (Reconciliation: Direct = Total Budget - Distributor Primary)
    dir_inv_net = max(0.0, inv_net - dis_pri_inv)
    dir_out_back = max(0.0, out_back_val - dis_pri_back)
    direct_actual = max(0.0, total_actual_val - dis_pri_actual)
    direct_target = max(0.0, total_target_val - dis_pri_target)

    direct_pct = int(round((direct_actual / direct_target) * 100)) if direct_target > 0 else 0
    direct_variance = round(direct_actual - direct_target, 2)

    annual_pct = int(round((fy_actual_val / annual_target) * 100)) if annual_target > 0 else 0

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
            "backlog": round(out_back_val, 2),
            "pct": total_pct,
            "variance": total_variance,
        },
        "direct_budget": {
            "target": round(direct_target, 2),
            "actual": round(direct_actual, 2),
            "invoiced": round(dir_inv_net, 2),
            "backlog": round(dir_out_back, 2),
            "pct": direct_pct,
            "variance": direct_variance,
        },
        "dis_pri": {
            "target": dis_pri_target,
            "actual": dis_pri_actual,
            "invoiced": dis_pri_inv,
            "backlog": dis_pri_back,
            "pct": dis_pri_pct,
            "variance": dis_pri_variance,
        },
        "dis_rd": {
            "target": dis_rd_target,
            "actual": dis_rd_actual,
            "pct": dis_rd_pct,
            "variance": dis_rd_variance,
        },
        "annual": {
            "target": round(annual_target, 2),
            "actual": round(fy_actual_val, 2),
            "month_actual": round(total_actual_val, 2),
            "month_target": round(total_target_val, 2),
            "month_name": selected_month.capitalize(),
            "pct": annual_pct,
            "month_pct": total_pct,
        }
    }
