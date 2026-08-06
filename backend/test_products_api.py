import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/total-range-fy?month=july'
print('Testing backend total-range-fy product SKUs on hover...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print('Total Ranges returned:', data['total_ranges'])
    for r in data['rows']:
        if r.get('sales_groups'):
            for sg in r['sales_groups']:
                if sg.get('products') and len(sg['products']) > 0:
                    print(f"\nSales Group: {sg['sales_group']} ({sg['products_count']} Products):")
                    for p in sg['products'][:3]:
                        print(f"  - Part No: {p['part_no']} | Product SKU: {p['product_sku']}")
                    break
            break
