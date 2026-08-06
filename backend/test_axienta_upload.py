import pandas as pd
import urllib.request
import json
import io

print("=== Testing Axienta Upload Endpoint ===")

data = {
    'product_id': ['PROD001', 'PROD002'],
    'product': ['Panadol 500mg', 'Amoxil 250mg'],
    'qty': [100.0, 50.0],
    'value': [150000.0, 250000.0]
}
df = pd.DataFrame(data)

excel_buffer = io.BytesIO()
df.to_excel(excel_buffer, index=False)
excel_bytes = excel_buffer.getvalue()

boundary = '----WebKitFormBoundaryAxientaTest'
body = []

# File
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="file"; filename="axienta_jul15.xlsx"'.encode('utf-8'))
body.append('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n'.encode('utf-8'))
body.append(excel_bytes)

# Entry Date
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="entry_date"\r\n'.encode('utf-8'))
body.append('2026-07-15'.encode('utf-8'))

# Overwrite
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="overwrite"\r\n'.encode('utf-8'))
body.append('true'.encode('utf-8'))

body.append(f'--{boundary}--\r\n'.encode('utf-8'))

payload = b'\r\n'.join(body)

req = urllib.request.Request(
    'http://localhost:8000/api/axienta/upload-excel',
    data=payload,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

with urllib.request.urlopen(req) as resp:
    result = json.loads(resp.read().decode('utf-8'))
    print("Upload Result:", json.dumps(result, indent=2))

# Verify calendar summary for July 2026
url_sum = 'http://localhost:8000/api/axienta/calendar-summary?year=2026&month=7'
with urllib.request.urlopen(url_sum) as resp:
    result_sum = json.loads(resp.read().decode('utf-8'))
    print("\nUpdated Calendar Summary:", json.dumps(result_sum, indent=2))
