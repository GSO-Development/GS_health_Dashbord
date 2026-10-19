import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_api3.py', 'w') as f:
    f.write('''
import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.routers.reports import get_total_range_fy
from app.routers.dashboard_fy import get_dashboard_fy_overview

print("=== 1. Total Range FY (2026-09-01 to 2026-09-26) ===")
res_tr = get_total_range_fy(month='september', date=None, start_date='2026-09-01', end_date='2026-09-26', search=None, backlog_mode='without', contracts=None)
print("Keys in res_tr:", res_tr.keys())
print("total_ranges:", res_tr.get("total_ranges"))
print("summary_totals:", res_tr.get("summary_totals"))
print("First 2 rows:")
for r in res_tr.get("rows", [])[:2]:
    print("  Row:", r.get("range_name"), "m_act:", r.get("m_act"), "m_tgt:", r.get("m_tgt"), "c_act:", r.get("c_act"), "c_tgt:", r.get("c_tgt"))

print("\\n=== 2. Dashboard FY Overview (2026-09-01 to 2026-09-26) ===")
res_db = get_dashboard_fy_overview(month='september', date=None, start_date='2026-09-01', end_date='2026-09-26', backlog_mode='without', contracts=None)
print("Keys in res_db:", res_db.keys())
print("summary_cards:", res_db.get("summary_cards"))

print("\\n=== 3. Check Test Mappings in DB ===")
from app.core.database import get_db_connection
conn = get_db_connection()
with conn.cursor() as cur:
    cur.execute("SELECT * FROM division_mappings WHERE sales_group IN ('MUYANGXI', 'COVID T1', 'MONOGRAM', 'LAMBO') OR range_name IN ('MUYANGXI', 'COVID T1', 'MONOGRAM', 'LAMBO');")
    mappings = cur.fetchall()
    print("division_mappings remaining count:", len(mappings))
    cur.execute("SELECT * FROM total_budget WHERE sales_group IN ('MUYANGXI', 'COVID T1', 'MONOGRAM', 'LAMBO') OR range_name IN ('MUYANGXI', 'COVID T1', 'MONOGRAM', 'LAMBO');")
    budgets = cur.fetchall()
    print("total_budget remaining count:", len(budgets))
conn.close()
''')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('/var/www/dashboard/backend/.venv/bin/python3 /tmp/test_api3.py')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
