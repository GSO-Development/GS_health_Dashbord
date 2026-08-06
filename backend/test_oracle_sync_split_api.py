import urllib.request
import json
import sys
sys.stdout.reconfigure(encoding='utf-8')

print("Testing Oracle Invoice Sync API endpoint...")
req_inv = urllib.request.Request('http://localhost:8000/api/oracle-sync/sync-invoices', data=json.dumps({}).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_inv) as resp:
    print("Invoice Sync Response:", json.dumps(json.loads(resp.read().decode('utf-8')), indent=2))

print("\nTesting Oracle Outstanding Sync API endpoint...")
req_out = urllib.request.Request('http://localhost:8000/api/oracle-sync/sync-outstanding', data=json.dumps({}).encode('utf-8'), headers={'Content-Type': 'application/json'})
with urllib.request.urlopen(req_out) as resp:
    print("Outstanding Sync Response:", json.dumps(json.loads(resp.read().decode('utf-8')), indent=2))
