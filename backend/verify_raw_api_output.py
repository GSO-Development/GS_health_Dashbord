import urllib.request
import json

url = 'http://localhost:8000/api/reports/total-range-fy?month=july'
print('Testing backend total-range-fy raw values...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print('Total Ranges returned:', data['total_ranges'])
    print('\nSample first 4 rows (Exact raw LKR values):')
    for r in data['rows'][:4]:
        print(f"  {r['division']}: Monthly Budget = {r['m_budget']:,.2f} | Cum Budget = {r['c_budget']:,.2f} | Annual Budget = {r['a_budget']:,.2f}")
