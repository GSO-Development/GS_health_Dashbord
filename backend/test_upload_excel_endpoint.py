import pandas as pd
import urllib.request
import urllib.parse
import json
import io

print("=== Testing Excel Upload Endpoint using urllib ===")

data = {
    'range_name': ['ADCOCK', 'AEROMED'],
    'sales_group': ['ADCOCK', 'CARA'],
    'part_no': ['CFL102', 'CAR001'],
    'product_sku': ['Cosvate G Cream 15gm', 'Pregax 75mg Cap\'s-14\'s'],
    'april': [100000.0, 100000.0],
    'may': [100000.0, 100000.0],
    'june': [100000.0, 100000.0],
    'july': [100000.0, 100000.0],
    'august': [100000.0, 100000.0],
    'september': [100000.0, 100000.0],
    'october': [100000.0, 100000.0],
    'november': [100000.0, 100000.0],
    'december': [100000.0, 100000.0],
    'january': [100000.0, 100000.0],
    'february': [100000.0, 100000.0],
    'march': [100000.0, 100000.0],
    'total': [1200000.0, 1200000.0]
}
df = pd.DataFrame(data)

excel_buffer = io.BytesIO()
df.to_excel(excel_buffer, index=False)
excel_bytes = excel_buffer.getvalue()

boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW'
body = []

# File
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="file"; filename="test_budget.xlsx"'.encode('utf-8'))
body.append('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n'.encode('utf-8'))
body.append(excel_bytes)

# Fiscal Year
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="fiscal_year"\r\n'.encode('utf-8'))
body.append('FY 2026/27'.encode('utf-8'))

# Overwrite
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="overwrite"\r\n'.encode('utf-8'))
body.append('false'.encode('utf-8'))

body.append(f'--{boundary}--\r\n'.encode('utf-8'))

payload = b'\r\n'.join(body)

req = urllib.request.Request(
    'http://localhost:8000/api/reports/budget/upload-excel',
    data=payload,
    headers={'Content-Type': f'multipart/form-data; boundary={boundary}'}
)

with urllib.request.urlopen(req) as resp:
    result = json.loads(resp.read().decode('utf-8'))
    print("API Overwrite Check Prompt Output:")
    print(json.dumps(result, indent=2))
