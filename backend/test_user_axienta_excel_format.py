import pandas as pd
import urllib.request
import json
import io

print("=== Testing User's Exact Axienta Excel Format ===")

# Create exact format from user screenshot
data = {
    'Product ID': ['SAJ01', 'SAJ02', 'CFL133', 'CFL137'],
    'Product': ["Lavish Enhance Bar (1's)", "Lavish Moist Bar (1's)", "Adclear Face Wash 60gm", "Cosmelite Cream"],
    'Qty': ['-1/0.000', '-1/0.000', '5391/0.000', '2848/0.000'],
    'Value': ['-1,119.37', '-1,119.37', '11,288,754.00', '10,807,875.20']
}
df = pd.DataFrame(data)

excel_buffer = io.BytesIO()
df.to_excel(excel_buffer, index=False)
excel_bytes = excel_buffer.getvalue()

boundary = '----WebKitFormBoundaryExactAxienta'
body = []

# File
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="file"; filename="exact_axienta_test.xlsx"'.encode('utf-8'))
body.append('Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet\r\n'.encode('utf-8'))
body.append(excel_bytes)

# Entry Date
body.append(f'--{boundary}'.encode('utf-8'))
body.append('Content-Disposition: form-data; name="entry_date"\r\n'.encode('utf-8'))
body.append('2026-07-20'.encode('utf-8'))

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
    print("\nUpload Response:", json.dumps(result, indent=2))
