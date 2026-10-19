import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection
from app.routers.reports import get_total_range_fy

res_tr = get_total_range_fy(month='september', date=None, start_date='2026-09-01', end_date='2026-09-26', search=None, backlog_mode='without', contracts=None)
dashboard_cum_actual = float(res_tr['summary_totals']['c_actual'])
print("1. Total Range FY Cumulative Actual (Dashboard): {:,.2f}".format(dashboard_cum_actual))

conn = get_db_connection()
with conn.cursor() as cur:
    cur.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as tot_all
        FROM invoice_output
        WHERE DATE(invoice_date) >= '2026-04-01' AND DATE(invoice_date) <= '2026-09-26';
    """)
    total_all_invoices = float(cur.fetchone()['tot_all'])
    print("2. Total Invoices (ALL contracts): {:,.2f}".format(total_all_invoices))

    cur.execute("""
        SELECT COALESCE(SUM(net_dom_amount), 0) as tot_filtered
        FROM invoice_output
        WHERE DATE(invoice_date) >= '2026-04-01' AND DATE(invoice_date) <= '2026-09-26'
          AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);
    """)
    total_filtered_contracts = float(cur.fetchone()['tot_filtered'])
    print("3. Total Invoices (Excl GSIEX, GSTEA, LTS): {:,.2f}".format(total_filtered_contracts))

    diff = total_filtered_contracts - dashboard_cum_actual
    print("4. Exact Difference (Filtered Invoices - Dashboard): {:,.2f}".format(diff))

    cur.execute("""
        SELECT DISTINCT LOWER(TRIM(sales_group)) as sg FROM division_mappings WHERE sales_group IS NOT NULL AND TRIM(sales_group) != ''
        UNION
        SELECT DISTINCT LOWER(TRIM(sales_group)) as sg FROM total_budget WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';
    """)
    mapped_sgs = set(r['sg'] for r in cur.fetchall() if r.get('sg'))

    cur.execute("""
        SELECT DISTINCT LOWER(TRIM(contract_code)) as c FROM division_mappings 
        WHERE match_type = 'CONTRACT' AND contract_code IS NOT NULL AND TRIM(contract_code) != '';
    """)
    contract_mappings = set(r['c'] for r in cur.fetchall() if r.get('c'))

    cur.execute("""
        SELECT DISTINCT LOWER(TRIM(part_no)) as p FROM total_budget WHERE part_no IS NOT NULL AND TRIM(part_no) != '';
    """)
    part_mappings = set(r['p'] for r in cur.fetchall() if r.get('p'))

    cur.execute("""
        SELECT 
            id, invoice_no, invoice_date, contract, catalog_group, catalog_no, description, net_dom_amount
        FROM invoice_output
        WHERE DATE(invoice_date) >= '2026-04-01' AND DATE(invoice_date) <= '2026-09-26'
          AND (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL);
    """)
    all_invoices = cur.fetchall()
    print("5. Total invoice records count: {}".format(len(all_invoices)))

    excluded_invoices = []
    excluded_by_group = {}
    for inv in all_invoices:
        sg = (inv.get('catalog_group') or '').strip().lower()
        c_code = (inv.get('contract') or '').strip().lower()
        part = (inv.get('catalog_no') or '').strip().lower()
        amt = float(inv.get('net_dom_amount') or 0)

        is_mapped = (c_code in contract_mappings) or (sg in mapped_sgs) or (part in part_mappings)

        if not is_mapped:
            excluded_invoices.append(inv)
            grp_name = inv.get('catalog_group') or '(blank / NULL)'
            if grp_name not in excluded_by_group:
                excluded_by_group[grp_name] = {'count': 0, 'total_amt': 0.0, 'items': []}
            excluded_by_group[grp_name]['count'] += 1
            excluded_by_group[grp_name]['total_amt'] += amt
            excluded_by_group[grp_name]['items'].append(inv)

    print("6. Total Unmapped / Excluded Invoices Count: {}".format(len(excluded_invoices)))
    total_excluded_val = sum(inv['net_dom_amount'] for inv in excluded_invoices)
    print("   Total Unmapped Value: Rs. {:,.2f}".format(total_excluded_val))

    print("\n=== BREAKDOWN OF ALL UNMAPPED GROUPS ===")
    for grp_name, data in sorted(excluded_by_group.items(), key=lambda x: x[1]['total_amt'], reverse=True):
        print("Group: %s | Total Value: Rs. %s | Invoices: %d" % (grp_name, "{:,.2f}".format(data['total_amt']), data['count']))
        for it in data['items']:
            d_str = str(it['invoice_date'])[:10]
            clean_desc = (it['description'] or '').replace('\n', ' ').replace('\r', '')[:35]
            print("   - Date: %s | Inv: %s | Site: %s | Part: %s | Desc: %s | Rs. %s" % (
                d_str, it['invoice_no'], it['contract'], it['catalog_no'], clean_desc, "{:,.2f}".format(it['net_dom_amount'])
            ))

conn.close()
