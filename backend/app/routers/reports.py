from typing import Optional, List, Dict
from fastapi import APIRouter, Query
from app.core.database import get_db_connection

router = APIRouter(prefix="/api/reports", tags=["Reports"])

# 1. Invoice Output Endpoint (19,046 records)
@router.get("/invoice-output")
def get_invoice_output(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    search: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    contract: Optional[str] = None
):
    page_num = int(page) if isinstance(page, (int, str)) and str(page).isdigit() else 1
    limit_num = int(limit) if isinstance(limit, (int, str)) and str(limit).isdigit() else 10
    offset = (page_num - 1) * limit_num

    conn = get_db_connection()
    where_clauses = []
    params = []

    if search:
        where_clauses.append("(invoice_no LIKE %s OR order_no LIKE %s OR delivery_customer_name LIKE %s OR catalog_no LIKE %s OR description LIKE %s)")
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    if year:
        where_clauses.append("YEAR(invoice_date) = %s")
        params.append(year)

    if month:
        where_clauses.append("MONTH(invoice_date) = %s")
        params.append(month)

    if start_date:
        where_clauses.append("DATE(invoice_date) >= %s")
        params.append(start_date)

    if end_date:
        where_clauses.append("DATE(invoice_date) <= %s")
        params.append(end_date)

    if contract and isinstance(contract, str) and contract.strip():
        where_clauses.append("UPPER(TRIM(contract)) = %s")
        params.append(contract.strip().upper())

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with conn.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) as cnt, COALESCE(SUM(net_dom_amount), 0) as total_net FROM invoice_output{where_sql};", params)
        agg = cursor.fetchone()
        total_count = agg['cnt']
        total_net_amount = round(agg['total_net'], 2)

        cursor.execute(f"SELECT * FROM invoice_output{where_sql} ORDER BY id ASC LIMIT %s OFFSET %s;", params + [limit_num, offset])
        rows = cursor.fetchall()

        for row in rows:
            if row.get("invoice_date"):
                row["invoice_date"] = str(row["invoice_date"])

    conn.close()

    return {
        "report_title": "Invoice Output Report",
        "total_count": total_count,
        "total": total_count,
        "total_net_amount": total_net_amount,
        "page": page_num,
        "limit": limit_num,
        "total_pages": (total_count + limit_num - 1) // limit_num if limit_num else 1,
        "rows": rows,
        "data": rows
    }


# 2. Outstanding Output Endpoint (170 records)
@router.get("/outstanding-output")
def get_outstanding_output(
    page: int = Query(1, ge=1),
    limit: int = Query(10, ge=1, le=500),
    search: Optional[str] = None,
    year: Optional[int] = None,
    month: Optional[int] = None,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    contract: Optional[str] = None
):
    page_num = int(page) if isinstance(page, (int, str)) and str(page).isdigit() else 1
    limit_num = int(limit) if isinstance(limit, (int, str)) and str(limit).isdigit() else 10
    offset = (page_num - 1) * limit_num

    conn = get_db_connection()
    where_clauses = []
    params = []

    if search:
        where_clauses.append("(customer_no LIKE %s OR customer_name LIKE %s OR order_no LIKE %s OR catalog_no LIKE %s OR catalog_desc LIKE %s)")
        s = f"%{search}%"
        params.extend([s, s, s, s, s])

    if year:
        where_clauses.append("YEAR(planned_delivery_date) = %s")
        params.append(year)

    if month:
        where_clauses.append("MONTH(planned_delivery_date) = %s")
        params.append(month)

    if start_date:
        where_clauses.append("DATE(planned_delivery_date) >= %s")
        params.append(start_date)

    if end_date:
        where_clauses.append("DATE(planned_delivery_date) <= %s")
        params.append(end_date)

    if contract and isinstance(contract, str) and contract.strip():
        where_clauses.append("UPPER(TRIM(contract)) = %s")
        params.append(contract.strip().upper())

    where_sql = (" WHERE " + " AND ".join(where_clauses)) if where_clauses else ""

    with conn.cursor() as cursor:
        cursor.execute(f"SELECT COUNT(*) as cnt, COALESCE(SUM(backlog_value_base_curr), 0) as total_backlog FROM outstanding_output{where_sql};", params)
        agg = cursor.fetchone()
        total_count = agg['cnt']
        total_backlog = round(agg['total_backlog'], 2)

        cursor.execute(f"SELECT * FROM outstanding_output{where_sql} ORDER BY id ASC LIMIT %s OFFSET %s;", params + [limit_num, offset])
        rows = cursor.fetchall()

        for row in rows:
            if row.get("planned_delivery_date"):
                row["planned_delivery_date"] = str(row["planned_delivery_date"])

    conn.close()

    return {
        "report_title": "Outstanding Output Report",
        "total_count": total_count,
        "total": total_count,
        "total_backlog_value": total_backlog,
        "page": page_num,
        "limit": limit_num,
        "total_pages": (total_count + limit_num - 1) // limit_num if limit_num else 1,
        "rows": rows,
        "data": rows
    }


# 3. Total Range Wise FY Endpoint (Range -> Sales Group -> Product SKUs mapped via division_mappings & invoice_output)
FY_MONTH_ORDER = [
    "april", "may", "june", "july", "august", "september",
    "october", "november", "december", "january", "february", "march"
]

MONTH_NUM_MAP = {
    "april": 4, "may": 5, "june": 6, "july": 7,
    "august": 8, "september": 9, "october": 10, "november": 11,
    "december": 12, "january": 1, "february": 2, "march": 3
}

@router.get("/total-range-fy")
def get_total_range_fy(
    month: Optional[str] = Query("july"),
    date: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    backlog_mode: Optional[str] = Query("with"),
    contracts: Optional[str] = Query(None)
):
    b_mode = (backlog_mode.lower().strip() if isinstance(backlog_mode, str) else "with")
    if b_mode not in ["with", "without", "only"]:
        b_mode = "with"

    m_clean = month.lower().strip() if isinstance(month, str) else "july"
    selected_month = m_clean if m_clean in FY_MONTH_ORDER else "july"
    
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

    has_date_filter = s_date is not None
    if has_date_filter and s_date > e_date:
        s_date, e_date = e_date, s_date
    
    idx = FY_MONTH_ORDER.index(selected_month)
    cum_months = FY_MONTH_ORDER[:idx + 1]
    cum_m_nums = [MONTH_NUM_MAP[m] for m in cum_months]

    # Handle Contracts Filter
    contract_list = []
    if isinstance(contracts, str) and contracts.strip():
        contract_list = [c.strip().upper() for c in contracts.split(",") if c.strip()]

    if contract_list:
        placeholders = ', '.join(['%s'] * len(contract_list))
        c_clause_i = f"AND UPPER(TRIM(i.contract)) IN ({placeholders})"
        c_clause_o = f"AND UPPER(TRIM(o.contract)) IN ({placeholders})"
        c_params = list(contract_list)
    else:
        c_clause_i = "AND (UPPER(TRIM(i.contract)) != 'GSTEA' OR i.contract IS NULL)"
        c_clause_o = "AND (UPPER(TRIM(o.contract)) != 'GSTEA' OR o.contract IS NULL)"
        c_params = []

    conn = get_db_connection()
    with conn.cursor() as cursor:
        # 1. Fetch Sales Group → Range Mappings from division_mappings table
        cursor.execute("""
            SELECT TRIM(sales_group) as s_grp, TRIM(range_name) as r_name 
            FROM division_mappings 
            WHERE range_name IS NOT NULL AND TRIM(range_name) != '';
        """)
        div_mappings_rows = cursor.fetchall()
        
        range_to_sg = {}
        sg_to_range = {}
        for r in div_mappings_rows:
            sg = r.get('s_grp')
            rn = r.get('r_name')
            if rn:
                rn_clean = rn.strip()
                if rn_clean not in range_to_sg:
                    range_to_sg[rn_clean] = set()
                if sg:
                    sg_clean = sg.strip()
                    range_to_sg[rn_clean].add(sg_clean)
                    sg_to_range[sg_clean.lower()] = rn_clean

        # 2. Fetch distinct range_name and sales_group from total_budget
        cursor.execute("""
            SELECT DISTINCT TRIM(range_name) as r_name, TRIM(sales_group) as s_grp 
            FROM total_budget 
            WHERE range_name IS NOT NULL AND TRIM(range_name) != '' 
              AND sales_group IS NOT NULL AND TRIM(sales_group) != '';
        """)
        for r in cursor.fetchall():
            rn_clean = r['r_name'].strip()
            sg_clean = r['s_grp'].strip()
            if sg_clean.lower() not in sg_to_range:
                if rn_clean not in range_to_sg:
                    range_to_sg[rn_clean] = set()
                range_to_sg[rn_clean].add(sg_clean)
                sg_to_range[sg_clean.lower()] = rn_clean

        # 3. Dynamic Discovery of any additional sales groups from invoice_output and outstanding_output
        cursor.execute("""
            SELECT DISTINCT TRIM(catalog_group) as s_grp 
            FROM invoice_output 
            WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != ''
              AND UPPER(TRIM(catalog_no)) NOT LIKE 'HET0%';
        """)
        for r in cursor.fetchall():
            sg_clean = r['s_grp'].strip()
            sg_key = sg_clean.lower()
            if sg_key not in sg_to_range:
                # Assign to itself as division if not mapped anywhere
                if sg_clean not in range_to_sg:
                    range_to_sg[sg_clean] = set()
                range_to_sg[sg_clean].add(sg_clean)
                sg_to_range[sg_key] = sg_clean

        cursor.execute("""
            SELECT DISTINCT TRIM(catalog_group) as s_grp 
            FROM outstanding_output 
            WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != ''
              AND UPPER(TRIM(catalog_no)) NOT LIKE 'HET0%';
        """)
        for r in cursor.fetchall():
            sg_clean = r['s_grp'].strip()
            sg_key = sg_clean.lower()
            if sg_key not in sg_to_range:
                if sg_clean not in range_to_sg:
                    range_to_sg[sg_clean] = set()
                range_to_sg[sg_clean].add(sg_clean)
                sg_to_range[sg_key] = sg_clean

        all_ranges = sorted(list(range_to_sg.keys()))

        # 4. Bulk fetch budgets grouped by sales_group from total_budget
        cursor.execute("""
            SELECT 
                TRIM(b.sales_group) as s_grp,
                TRIM(b.range_name) as r_name,
                SUM(b.april) as april, SUM(b.may) as may, SUM(b.june) as june, SUM(b.july) as july,
                SUM(b.august) as august, SUM(b.september) as september, SUM(b.october) as october,
                SUM(b.november) as november, SUM(b.december) as december, SUM(b.january) as january,
                SUM(b.february) as february, SUM(b.march) as march, SUM(b.total) as total
            FROM total_budget b
            GROUP BY s_grp, r_name;
        """)
        sg_b_map = {}
        for r in cursor.fetchall():
            s_grp = r.get('s_grp')
            if s_grp:
                sg_key = s_grp.strip().lower()
                sg_b_map[sg_key] = r

        # 5. Bulk fetch invoice actuals (NET_DOM_AMOUNT) from invoice_output table
        if has_date_filter:
            cursor.execute(f"""
                SELECT 
                    TRIM(i.catalog_group) as s_grp,
                    TRIM(i.catalog_no) as part_no,
                    MONTH(i.invoice_date) as inv_m,
                    SUM(i.net_dom_amount) as total_act
                FROM invoice_output i
                WHERE DATE(i.invoice_date) >= %s AND DATE(i.invoice_date) <= %s {c_clause_i}
                  AND UPPER(TRIM(i.catalog_no)) NOT LIKE 'HET0%'
                GROUP BY s_grp, part_no, inv_m;
            """, [s_date, e_date] + c_params)
        else:
            inv_query = f"""
                SELECT 
                    TRIM(i.catalog_group) as s_grp,
                    TRIM(i.catalog_no) as part_no,
                    MONTH(i.invoice_date) as inv_m,
                    SUM(i.net_dom_amount) as total_act
                FROM invoice_output i
                WHERE 1=1 {c_clause_i}
                  AND UPPER(TRIM(i.catalog_no)) NOT LIKE 'HET0%'
                GROUP BY s_grp, part_no, inv_m;
            """
            if c_params:
                cursor.execute(inv_query, c_params)
            else:
                cursor.execute(inv_query)

        sg_inv_map = {}
        p_inv_map = {}
        for r in cursor.fetchall():
            s_grp = r.get('s_grp')
            part_no = r.get('part_no')
            inv_m = int(r.get('inv_m') or 0)
            act_val = float(r.get('total_act') or 0)

            if s_grp and inv_m:
                sk = (s_grp.strip().lower(), inv_m)
                sg_inv_map[sk] = sg_inv_map.get(sk, 0.0) + act_val

            if s_grp and part_no and inv_m:
                pk = (s_grp.strip().lower(), part_no.strip().lower(), inv_m)
                p_inv_map[pk] = p_inv_map.get(pk, 0.0) + act_val

        # 6. Bulk fetch outstanding backlog
        if has_date_filter:
            cursor.execute(f"""
                SELECT 
                    TRIM(o.catalog_group) as s_grp,
                    TRIM(o.catalog_no) as part_no,
                    SUM(o.backlog_value_base_curr) as total_back
                FROM outstanding_output o
                WHERE DATE(o.planned_delivery_date) >= %s AND DATE(o.planned_delivery_date) <= %s {c_clause_o}
                  AND UPPER(TRIM(o.catalog_no)) NOT LIKE 'HET0%'
                GROUP BY s_grp, part_no;
            """, [s_date, e_date] + c_params)
        else:
            out_query = f"""
                SELECT 
                    TRIM(o.catalog_group) as s_grp,
                    TRIM(o.catalog_no) as part_no,
                    SUM(o.backlog_value_base_curr) as total_back
                FROM outstanding_output o
                WHERE 1=1 {c_clause_o}
                  AND UPPER(TRIM(o.catalog_no)) NOT LIKE 'HET0%'
                GROUP BY s_grp, part_no;
            """
            if c_params:
                cursor.execute(out_query, c_params)
            else:
                cursor.execute(out_query)
        sg_back_map = {}
        p_back_map = {}
        for r in cursor.fetchall():
            s_grp = r.get('s_grp')
            part_no = r.get('part_no')
            back_val = float(r.get('total_back') or 0)

            if s_grp:
                sk = s_grp.strip().lower()
                sg_back_map[sk] = sg_back_map.get(sk, 0.0) + back_val
            if s_grp and part_no:
                pk = (s_grp.strip().lower(), part_no.strip().lower())
                p_back_map[pk] = p_back_map.get(pk, 0.0) + back_val

        # 7. Bulk fetch individual product rows from total_budget with monthly budgets
        cursor.execute("""
            SELECT 
                TRIM(sales_group) as s_grp,
                TRIM(part_no) as part_no,
                TRIM(product_sku) as product_sku,
                SUM(april) as april, SUM(may) as may, SUM(june) as june, SUM(july) as july,
                SUM(august) as august, SUM(september) as september, SUM(october) as october,
                SUM(november) as november, SUM(december) as december, SUM(january) as january,
                SUM(february) as february, SUM(march) as march, SUM(total) as total
            FROM total_budget
            WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
            GROUP BY s_grp, part_no, product_sku;
        """)
        sg_products_map = {}
        seen_sg_prods = set()
        for r in cursor.fetchall():
            s_grp = r.get('s_grp')
            p_no = r.get('part_no')
            if s_grp and p_no:
                k = s_grp.strip().lower()
                if k not in sg_products_map:
                    sg_products_map[k] = []
                sg_products_map[k].append(r)
                seen_sg_prods.add((k, p_no.strip().lower()))

        # Also fetch distinct catalog items / subcodes from invoice_output
        cursor.execute("""
            SELECT DISTINCT TRIM(catalog_group) as s_grp, TRIM(catalog_no) as part_no, TRIM(description) as product_sku
            FROM invoice_output
            WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != ''
              AND catalog_no IS NOT NULL AND TRIM(catalog_no) != ''
              AND UPPER(TRIM(catalog_no)) NOT LIKE 'HET0%';
        """)
        for r in cursor.fetchall():
            s_grp = r.get('s_grp')
            p_no = r.get('part_no')
            if s_grp and p_no:
                k = s_grp.strip().lower()
                pk = p_no.strip().lower()
                if (k, pk) not in seen_sg_prods:
                    seen_sg_prods.add((k, pk))
                    if k not in sg_products_map:
                        sg_products_map[k] = []
                    sg_products_map[k].append({
                        's_grp': s_grp,
                        'part_no': p_no,
                        'product_sku': r.get('product_sku') or p_no,
                        'april': 0, 'may': 0, 'june': 0, 'july': 0, 'august': 0, 'september': 0,
                        'october': 0, 'november': 0, 'december': 0, 'january': 0, 'february': 0, 'march': 0, 'total': 0
                    })

        # Also fetch distinct catalog items / subcodes from outstanding_output
        cursor.execute("""
            SELECT DISTINCT TRIM(catalog_group) as s_grp, TRIM(catalog_no) as part_no, TRIM(catalog_desc) as product_sku
            FROM outstanding_output
            WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != ''
              AND catalog_no IS NOT NULL AND TRIM(catalog_no) != ''
              AND UPPER(TRIM(catalog_no)) NOT LIKE 'HET0%';
        """)
        for r in cursor.fetchall():
            s_grp = r.get('s_grp')
            p_no = r.get('part_no')
            if s_grp and p_no:
                k = s_grp.strip().lower()
                pk = p_no.strip().lower()
                if (k, pk) not in seen_sg_prods:
                    seen_sg_prods.add((k, pk))
                    if k not in sg_products_map:
                        sg_products_map[k] = []
                    sg_products_map[k].append({
                        's_grp': s_grp,
                        'part_no': p_no,
                        'product_sku': r.get('product_sku') or p_no,
                        'april': 0, 'may': 0, 'june': 0, 'july': 0, 'august': 0, 'september': 0,
                        'october': 0, 'november': 0, 'december': 0, 'january': 0, 'february': 0, 'march': 0, 'total': 0
                    })

    conn.close()

    data = []
    tot_m_budget = 0.0
    tot_m_actual = 0.0
    tot_c_budget = 0.0
    tot_c_actual = 0.0
    tot_a_budget = 0.0
    tot_a_actual = 0.0

    sel_m_num = MONTH_NUM_MAP[selected_month]

    for index, r_name in enumerate(all_ranges, 1):
        # Build Sub-List of Mapped Sales Groups for this Range
        sg_set = range_to_sg.get(r_name, set())

        sales_groups_list = []
        for sg_name in sorted(list(sg_set)):
            sg_k = sg_name.lower()
            sg_b_entry = sg_b_map.get(sg_k, {})

            sg_m_b = float(sg_b_entry.get(selected_month) or 0)
            sg_inv_m = sg_inv_map.get((sg_k, sel_m_num), 0.0)

            sg_c_b = sum(float(sg_b_entry.get(m) or 0) for m in cum_months)
            sg_inv_c = sum(sg_inv_map.get((sg_k, mn), 0.0) for mn in cum_m_nums)

            sg_a_b = float(sg_b_entry.get('total') or 0)
            sg_inv_a = sum(sg_inv_map.get((sg_k, mn), 0.0) for mn in MONTH_NUM_MAP.values())

            sg_back = sg_back_map.get(sg_k, 0.0)

            if b_mode == "without":
                sg_m_a = sg_inv_m
                sg_c_a = sg_inv_c
                sg_a_a = sg_inv_a
            elif b_mode == "only":
                sg_m_a = sg_back
                sg_c_a = sg_back
                sg_a_a = sg_back
            else:  # "with"
                sg_m_a = sg_inv_m + sg_back
                sg_c_a = sg_inv_c + sg_back
                sg_a_a = sg_inv_a + sg_back

            sg_mb_v = round(sg_m_b, 2)
            sg_ma_v = round(sg_m_a, 2)
            sg_cb_v = round(sg_c_b, 2)
            sg_ca_v = round(sg_c_a, 2)
            sg_ab_v = round(sg_a_b, 2)
            sg_aa_v = round(sg_a_a, 2)

            sg_cur_p = round((sg_ma_v / sg_mb_v) * 100) if sg_mb_v > 0 else 0
            sg_cum_p = round((sg_ca_v / sg_cb_v) * 100) if sg_cb_v > 0 else 0
            sg_tot_p = round((sg_aa_v / sg_ab_v) * 100) if sg_ab_v > 0 else 0

            # Calculate individual Product Financial Breakdown
            raw_prods = sg_products_map.get(sg_k, [])
            products_list = []
            for p in raw_prods:
                p_no = p.get('part_no') or '-'
                p_sku = p.get('product_sku') or '-'
                pk = p_no.lower()

                p_mb = float(p.get(selected_month) or 0)
                p_inv_m = p_inv_map.get((sg_k, pk, sel_m_num), 0.0)

                p_cb = sum(float(p.get(m) or 0) for m in cum_months)
                p_inv_c = sum(p_inv_map.get((sg_k, pk, mn), 0.0) for mn in cum_m_nums)

                p_ab = float(p.get('total') or 0)
                p_inv_a = sum(p_inv_map.get((sg_k, pk, mn), 0.0) for mn in MONTH_NUM_MAP.values())

                p_back = p_back_map.get((sg_k, pk), 0.0)

                if b_mode == "without":
                    p_ma = p_inv_m
                    p_ca = p_inv_c
                    p_aa = p_inv_a
                elif b_mode == "only":
                    p_ma = p_back
                    p_ca = p_back
                    p_aa = p_back
                else:  # "with"
                    p_ma = p_inv_m + p_back
                    p_ca = p_inv_c + p_back
                    p_aa = p_inv_a + p_back

                p_mb_v = round(p_mb, 2)
                p_ma_v = round(p_ma, 2)
                p_cb_v = round(p_cb, 2)
                p_ca_v = round(p_ca, 2)
                p_ab_v = round(p_ab, 2)
                p_aa_v = round(p_aa, 2)

                p_cur_p = round((p_ma_v / p_mb_v) * 100) if p_mb_v > 0 else 0
                p_cum_p = round((p_ca_v / p_cb_v) * 100) if p_cb_v > 0 else 0
                p_tot_p = round((p_aa_v / p_ab_v) * 100) if p_ab_v > 0 else 0

                products_list.append({
                    "part_no": p_no,
                    "product_sku": p_sku,
                    "m_budget": p_mb_v,
                    "m_actual": p_ma_v,
                    "cur_pct": p_cur_p,
                    "c_budget": p_cb_v,
                    "c_actual": p_ca_v,
                    "cum_pct": p_cum_p,
                    "a_budget": p_ab_v,
                    "a_actual": p_aa_v,
                    "tot_pct": p_tot_p
                })

            sales_groups_list.append({
                "sales_group": sg_name,
                "m_budget": sg_mb_v,
                "m_actual": sg_ma_v,
                "cur_pct": sg_cur_p,
                "c_budget": sg_cb_v,
                "c_actual": sg_ca_v,
                "cum_pct": sg_cum_p,
                "a_budget": sg_ab_v,
                "a_actual": sg_aa_v,
                "tot_pct": sg_tot_p,
                "products": products_list,
                "products_count": len(products_list)
            })

        # Calculate Parent Range Totals by Summing all mapped Sales Groups (Guarantees 100% Mathematical Consistency)
        m_b_val = round(sum(sg['m_budget'] for sg in sales_groups_list), 2)
        m_a_val = round(sum(sg['m_actual'] for sg in sales_groups_list), 2)
        c_b_val = round(sum(sg['c_budget'] for sg in sales_groups_list), 2)
        c_a_val = round(sum(sg['c_actual'] for sg in sales_groups_list), 2)
        a_b_val = round(sum(sg['a_budget'] for sg in sales_groups_list), 2)
        a_a_val = round(sum(sg['a_actual'] for sg in sales_groups_list), 2)

        cur_pct = round((m_a_val / m_b_val) * 100) if m_b_val > 0 else 0
        cum_pct = round((c_a_val / c_b_val) * 100) if c_b_val > 0 else 0
        tot_pct = round((a_a_val / a_b_val) * 100) if a_b_val > 0 else 0

        data.append({
            "no": index,
            "division": r_name,
            "m_budget": m_b_val,
            "m_actual": m_a_val,
            "cur_pct": cur_pct,
            "c_budget": c_b_val,
            "c_actual": c_a_val,
            "cum_pct": cum_pct,
            "a_budget": a_b_val,
            "a_actual": a_a_val,
            "tot_pct": tot_pct,
            "sales_groups": sales_groups_list
        })

        tot_m_budget += m_b_val
        tot_m_actual += m_a_val
        tot_c_budget += c_b_val
        tot_c_actual += c_a_val
        tot_a_budget += a_b_val
        tot_a_actual += a_a_val

    # Comprehensive Multi-Level Search Filter (Division, Sales Group, Part No, Product SKU)
    if isinstance(search, str) and search.strip():
        s_term = search.lower().strip()
        filtered_data = []
        for row in data:
            match_div = s_term in row['division'].lower()
            matched_sgs = []
            for sg in row['sales_groups']:
                match_sg = s_term in sg['sales_group'].lower()
                matched_prods = [p for p in sg['products'] if s_term in p['part_no'].lower() or s_term in p['product_sku'].lower()]
                if match_div or match_sg or len(matched_prods) > 0:
                    sg_copy = dict(sg)
                    if not match_div and not match_sg and len(matched_prods) > 0:
                        sg_copy['products'] = matched_prods
                        sg_copy['products_count'] = len(matched_prods)
                    matched_sgs.append(sg_copy)
            
            if match_div or len(matched_sgs) > 0:
                row_copy = dict(row)
                row_copy['sales_groups'] = matched_sgs
                filtered_data.append(row_copy)
        
        for idx, r in enumerate(filtered_data, 1):
            r['no'] = idx
        data = filtered_data

    total_cur_pct = round((tot_m_actual / tot_m_budget) * 100) if tot_m_budget > 0 else 0
    total_cum_pct = round((tot_c_actual / tot_c_budget) * 100) if tot_c_budget > 0 else 0
    total_tot_pct = round((tot_a_actual / tot_a_budget) * 100) if tot_a_budget > 0 else 0

    return {
        "selected_month": selected_month,
        "total_ranges": len(data),
        "summary_totals": {
            "m_budget": round(tot_m_budget, 2),
            "m_actual": round(tot_m_actual, 2),
            "cur_pct": total_cur_pct,
            "c_budget": round(tot_c_budget, 2),
            "c_actual": round(tot_c_actual, 2),
            "cum_pct": total_cum_pct,
            "a_budget": round(tot_a_budget, 2),
            "a_actual": round(tot_a_actual, 2),
            "tot_pct": total_tot_pct
        },
        "rows": data
    }
