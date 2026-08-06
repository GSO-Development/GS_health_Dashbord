import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/dashboard-fy-overview?month=july'
print('Testing Dashboard FY Overview API response...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Dashboard FY Response:", json.dumps(data, indent=2))
