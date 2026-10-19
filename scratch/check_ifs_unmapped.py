import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_unmapped_ifs.py', 'w') as f:
    f.write('''
import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cur:
    # 1. Distinct catalog_groups in invoice_output
    cur.execute("""
        SELECT 
            TRIM(i.catalog_group) as ifs_sales_group,
            COUNT(DISTINCT i.catalog_no) as item_count,
            COUNT(*) as invoice_count,
            SUM(i.net_dom_amount) as total_net_amount
        FROM invoice_output i
        WHERE i.catalog_group IS NOT NULL AND TRIM(i.catalog_group) != ''
        GROUP BY TRIM(i.catalog_group)
        ORDER BY total_net_amount DESC;
    """)
    ifs_groups = cur.fetchall()
    print(f"Total distinct IFS catalog groups: {len(ifs_groups)}")

    # 2. Get division mappings sales groups
    cur.execute("SELECT LOWER(TRIM(sales_group)) as sg FROM division_mappings;")
    mapped_sgs = set(r['sg'] for r in cur.fetchall() if r['sg'])

    unmapped = []
    for g in ifs_groups:
        sg_name = g['ifs_sales_group']
        if sg_name.lower() not in mapped_sgs:
            unmapped.append(g)

    print(f"Total unmapped IFS sales groups: {len(unmapped)}")
    print("Unmapped groups list:")
    for u in unmapped[:15]:
        print(f"  Group: {u['ifs_sales_group']} | Items: {u['item_count']} | Invoices: {u['invoice_count']} | Total Net: {u['total_net_amount']:,.2f}")

conn.close()
''')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('/var/www/dashboard/backend/.venv/bin/python3 /tmp/check_unmapped_ifs.py')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
