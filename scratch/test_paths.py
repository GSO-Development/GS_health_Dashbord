import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('''/var/www/dashboard/backend/.venv/bin/python3 -c "
import urllib.request
import json

for path in ['/api/division-mappings/stats', '/api/division-mappings/contracts', '/api/division-mappings/unmapped-ifs-summary']:
    try:
        req = urllib.request.Request(f'http://127.0.0.1:8000{path}')
        with urllib.request.urlopen(req) as resp:
            print(path, '-> Status:', resp.status)
    except Exception as e:
        print(path, '-> Error:', e)
"''')
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
