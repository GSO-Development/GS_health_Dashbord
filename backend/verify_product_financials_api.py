import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/total-range-fy?month=july'
print('Testing backend product-level financial figures...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print('Total Ranges returned:', data['total_ranges'])
    for r in data['rows']:
        if r.get('sales_groups'):
            for sg in r['sales_groups']:
                if sg.get('products') and len(sg['products']) > 0:
                    print(f"\nDivision Range: {r['division']} | Sales Group: {sg['sales_group']} ({sg['products_count']} Products):")
                    for p in sg['products'][:3]:
                        print(f"  - Part: {p['part_no']} | SKU: {p['product_sku'][:25]}")
                        print(f"    Monthly: B={p['m_budget']:,.2f} | A={p['m_actual']:,.2f} | %={p['cur_pct']}%")
                        print(f"    Cum (4M): B={p['c_budget']:,.2f} | A={p['c_actual']:,.2f} | %={p['cum_pct']}%")
                        print(f"    Annual:  B={p['a_budget']:,.2f} | A={p['a_actual']:,.2f} | %={p['tot_pct']}%")
                    break
            break
