import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/total-range-fy?month=july'
print('Testing backend total-range-fy sales_groups breakdown...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print('Total Ranges returned:', data['total_ranges'])
    for r in data['rows']:
        if r.get('sales_groups') and len(r['sales_groups']) > 0:
            print(f"\nDivision Range: {r['division']} ({len(r['sales_groups'])} Sales Groups):")
            for sg in r['sales_groups']:
                print(f"  -> Sales Group: {sg['sales_group']} | Monthly Budget = {sg['m_budget']:,.2f} | Monthly Actual = {sg['m_actual']:,.2f}")
