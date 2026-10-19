import urllib.request
import json
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

req = urllib.request.Request('https://gsh-sd.georgesteuart.lk/api/division-mappings/unmapped-ifs-items?limit=4')
with urllib.request.urlopen(req, context=ctx) as resp:
    data = json.loads(resp.read().decode())
    print('Status:', data.get('status'), '| Count:', data.get('total_count'))
    for it in data.get('items', []):
        print(f"  [{it['sales_group']}] {it['catalog_no']} | Date: {it.get('invoice_date')} | Price: Rs. {it['unit_price']:,.2f} | Net: Rs. {it['total_net_amount']:,.2f}")
