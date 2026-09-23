import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123')

remote_code = """
import sys
sys.path.append('/var/www/dashboard/backend')
from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cur:
    cur.execute('''
        SELECT YEAR(invoice_date) as yr, MONTH(invoice_date) as mo, SUM(net_dom_amount) as total
        FROM invoice_output
        GROUP BY YEAR(invoice_date), MONTH(invoice_date)
        ORDER BY yr, mo;
    ''')
    for r in cur.fetchall():
        print(r)
        
    cur.execute('''
        SELECT SUM(net_dom_amount) as fy_sum
        FROM invoice_output
        WHERE (
            (YEAR(invoice_date) = 2026 AND MONTH(invoice_date) >= 4) OR
            (YEAR(invoice_date) = 2027 AND MONTH(invoice_date) <= 3)
        );
    ''')
    print('FY 2026/27 total invoice_output:', cur.fetchone())
conn.close()
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_fy_dates.py', 'w') as f:
    f.write(remote_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('/var/www/dashboard/backend/venv/bin/python /tmp/check_fy_dates.py')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
