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
    # 1. Check invoice_output sum for FY 2026/2027 (April 2026 - March 2027) with non-excluded contracts
    cur.execute('''
        SELECT 
            YEAR(invoice_date) as yr,
            MONTH(invoice_date) as mo,
            COUNT(*) as cnt,
            SUM(net_dom_amount) as total_inv
        FROM invoice_output
        WHERE (UPPER(TRIM(contract)) NOT IN ('GSIEX', 'GSTEA', 'LTS') OR contract IS NULL)
          AND (
              (YEAR(invoice_date) = 2026 AND MONTH(invoice_date) >= 4) OR
              (YEAR(invoice_date) = 2027 AND MONTH(invoice_date) <= 3)
          )
        GROUP BY yr, mo
        ORDER BY yr, mo;
    ''')
    rows = cur.fetchall()
    print("FY 2026/2027 Invoiced by Month:")
    total_fy_inv = 0
    for r in rows:
        print(f"  Yr {r['yr']} Month {r['mo']}: {r['total_inv']:,.2f}")
        total_fy_inv += float(r['total_inv'] or 0)
    print(f"Total FY 2026/2027 Invoiced: {total_fy_inv:,.2f}")
conn.close()
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_fy_details.py', 'w') as f:
    f.write(remote_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('/var/www/dashboard/backend/venv/bin/python /tmp/check_fy_details.py')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
