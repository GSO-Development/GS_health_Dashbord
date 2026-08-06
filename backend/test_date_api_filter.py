import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("1. Testing Full Month July 2026 Dashboard API:")
url_month = 'http://localhost:8000/api/reports/dashboard-fy-overview?month=july'
with urllib.request.urlopen(url_month) as resp:
    data_month = json.loads(resp.read().decode('utf-8'))
    print("  Month Target:", data_month['total_budget']['target'])
    print("  Month Actual:", data_month['total_budget']['actual'])
    print("  Month %:", data_month['total_budget']['pct'])

print("\n2. Testing Single Date July 15, 2026 Dashboard API:")
url_date15 = 'http://localhost:8000/api/reports/dashboard-fy-overview?month=july&date=2026-07-15'
with urllib.request.urlopen(url_date15) as resp:
    data_date15 = json.loads(resp.read().decode('utf-8'))
    print("  Date Label:", data_date15['month_label'])
    print("  Daily Target:", data_date15['total_budget']['target'])
    print("  Daily Actual:", data_date15['total_budget']['actual'])
    print("  Daily %:", data_date15['total_budget']['pct'])

print("\n3. Testing Single Date July 01, 2026 Dashboard API:")
url_date01 = 'http://localhost:8000/api/reports/dashboard-fy-overview?month=july&date=2026-07-01'
with urllib.request.urlopen(url_date01) as resp:
    data_date01 = json.loads(resp.read().decode('utf-8'))
    print("  Date Label:", data_date01['month_label'])
    print("  Daily Target:", data_date01['total_budget']['target'])
    print("  Daily Actual:", data_date01['total_budget']['actual'])
    print("  Daily %:", data_date01['total_budget']['pct'])
