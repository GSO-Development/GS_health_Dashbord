import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

url = 'http://localhost:8000/api/axienta/calendar-summary?year=2026&month=7'
print('Testing Axienta calendar summary API output...')
with urllib.request.urlopen(url) as resp:
    data = json.loads(resp.read().decode('utf-8'))
    print("Calendar Summary Response:", json.dumps(data, indent=2))
