import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/distri-range-fy?month=july'
print('Testing DISTRI-Range wise FY API response...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Total Divisions:", data.get("total_divisions"))
    print("Grand Total Summary:", json.dumps(data.get("grand_total"), indent=2))
    print("Sample First Division (Level 1):", json.dumps(data.get("tree", [])[0] if data.get("tree") else {}, indent=2)[:500])
