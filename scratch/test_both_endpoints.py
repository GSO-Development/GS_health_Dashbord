import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('''/var/www/dashboard/backend/.venv/bin/python3 -c "
import urllib.request
import json
import time

for path in ['/api/division-mappings/unmapped-ifs-summary', '/api/division-mappings/unmapped-ifs-items?limit=3']:
    try:
        req = urllib.request.Request(f'http://127.0.0.1:8000{path}')
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(path, '-> Status:', resp.status)
            if 'total_unmapped_groups' in data:
                print('  Total Groups:', data['total_unmapped_groups'], 'Total Items:', data['total_unmapped_items'], 'Total Value:', data['total_unmapped_value'])
            if 'items' in data:
                print('  Returned items count:', len(data['items']), 'Total Items in DB:', data['total_count'])
                for it in data['items']:
                    print('   -', it['sales_group'], '|', it['catalog_no'], '|', it['description'][:30], '| Price:', it['unit_price'], '| Net:', it['total_net_amount'])
    except Exception as e:
        print(path, '-> Error:', e)
"''')
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
