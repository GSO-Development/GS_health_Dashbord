import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/total-range-fy?month=july'
print('Testing backend parent Range budget summation fix...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print('Total Ranges returned:', data['total_ranges'])
    for r in data['rows']:
        if r['division'] == 'BL':
            print(f"\nParent Division Range: {r['division']}:")
            print(f"  Monthly Budget = {r['m_budget']:,.2f} | Monthly Actual = {r['m_actual']:,.2f} | % = {r['cur_pct']}%")
            print(f"  Cum Budget (4M) = {r['c_budget']:,.2f} | Cum Actual = {r['c_actual']:,.2f} | % = {r['cum_pct']}%")
            print(f"  Annual Budget   = {r['a_budget']:,.2f} | Annual Actual = {r['a_actual']:,.2f} | % = {r['tot_pct']}%")
            print("\n  Constituent Sales Groups:")
            for sg in r['sales_groups']:
                print(f"    - {sg['sales_group']}: Monthly Budget = {sg['m_budget']:,.2f} | Actual = {sg['m_actual']:,.2f}")
            break
