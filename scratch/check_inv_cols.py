import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_inv_cols.py', 'w') as f:
    f.write('''
import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cur:
    cur.execute("DESCRIBE invoice_output;")
    cols = cur.fetchall()
    for c in cols:
        print(c['Field'], c['Type'])
conn.close()
''')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('/var/www/dashboard/backend/.venv/bin/python3 /tmp/check_inv_cols.py')
print(stdout.read().decode())
ssh.close()
