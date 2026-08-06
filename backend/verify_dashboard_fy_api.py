import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/dashboard-fy-overview?month=july'
print('Testing dashboard-fy-overview API output...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("\nSelected Month:", data['month_label'])
    
    print("\n1. TOTAL BUDGET vs ACTUAL:")
    print("   Target:", f"LKR {data['total_budget']['target']:,.2f}")
    print("   Actual:", f"LKR {data['total_budget']['actual']:,.2f}")
    print("   Achievement %:", f"{data['total_budget']['pct']}%")
    print("   Formula:", data['total_budget']['actual_formula'])

    print("\n2. DIRECT BUDGET vs ACTUAL:")
    print("   Target:", f"LKR {data['direct_budget']['target']:,.2f}")
    print("   Actual:", f"LKR {data['direct_budget']['actual']:,.2f}")
    print("   Achievement %:", f"{data['direct_budget']['pct']}%")
    print("   Formula:", data['direct_budget']['actual_formula'])

    print("\n3. DIS : PRI BUDGET vs ACTUAL:")
    print("   Target:", f"LKR {data['dis_pri']['target']:,.2f}")
    print("   Actual:", f"LKR {data['dis_pri']['actual']:,.2f}")
    print("   Achievement %:", f"{data['dis_pri']['pct']}%")
    print("   Formula:", data['dis_pri']['actual_formula'])
