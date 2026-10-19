import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('''/var/www/dashboard/backend/.venv/bin/python3 -c "
import urllib.request
import json

req = urllib.request.Request('http://127.0.0.1:8000/api/division-mappings/unmapped-ifs-summary')
try:
    with urllib.request.urlopen(req) as resp:
        data = json.loads(resp.read().decode())
        print('Summary Response:')
        print('Status:', data.get('status'))
        print('Total Groups:', data.get('total_unmapped_groups'))
        print('Total Items:', data.get('total_unmapped_items'))
        print('Total Value:', data.get('total_unmapped_value'))
        print('First 3 groups:', data.get('groups', [])[:3])
except Exception as e:
    print('Error:', e)
"''')
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
