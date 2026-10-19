import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('''/var/www/dashboard/backend/.venv/bin/python3 -c "
import requests
r = requests.get('http://127.0.0.1:8000/api/division-mappings/unmapped-ifs-summary')
print('Status:', r.status_code)
print('JSON:', r.json())
"''')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
