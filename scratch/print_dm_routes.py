import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('''/var/www/dashboard/backend/.venv/bin/python3 -c "
import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.routers import division_mappings

for r in division_mappings.router.routes:
    print(getattr(r, 'methods', ''), getattr(r, 'path', ''))
"''')
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
