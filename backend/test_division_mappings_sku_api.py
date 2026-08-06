import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/division-mappings?year=FY+2026%2F27'
print('Testing Division Mappings SKU & Part No API response...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Total items:", data.get("total"))
    print("Sample First 3 rows:")
    for r in data.get("data", [])[:3]:
        print(" ", json.dumps(r, indent=2))
