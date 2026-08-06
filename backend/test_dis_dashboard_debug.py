import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/reports/dis-dashboard-fy-overview?month=july'
print('Testing GET /api/reports/dis-dashboard-fy-overview?month=july ...')
try:
    with urllib.request.urlopen(url) as resp:
        data = json.loads(resp.read().decode('utf-8'))
        print("Success! Data keys:", list(data.keys()))
        print(json.dumps(data, indent=2))
except Exception as e:
    print("Error:", str(e))
