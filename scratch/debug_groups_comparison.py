import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

sftp = ssh.open_sftp()
with sftp.file('/tmp/debug_groups.py', 'w') as f:
    f.write('''
import sys
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection

conn = get_db_connection()
with conn.cursor() as cur:
    # 1. Sales groups in division_mappings
    cur.execute("SELECT DISTINCT TRIM(sales_group) as sg FROM division_mappings WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';")
    dm_sgs = set(r['sg'] for r in cur.fetchall() if r['sg'])
    print(f"Total Sales Groups in division_mappings: {len(dm_sgs)}")

    # 2. Sales groups in total_budget
    cur.execute("SELECT DISTINCT TRIM(sales_group) as sg FROM total_budget WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';")
    tb_sgs = set(r['sg'] for r in cur.fetchall() if r['sg'])
    print(f"Total Sales Groups in total_budget: {len(tb_sgs)}")

    # 3. All Sales groups displayed on the map-divisions page table:
    # (The page shows all distinct sales groups from total_budget and division_mappings)
    all_page_sgs = set(s.lower() for s in dm_sgs.union(tb_sgs))
    print(f"Total Combined Sales Groups on map-divisions page: {len(all_page_sgs)}")

    # 4. Catalog Groups in invoice_output (IFS Invoices)
    cur.execute("""
        SELECT 
            TRIM(catalog_group) as ifs_group,
            COUNT(DISTINCT catalog_no) as items,
            COUNT(*) as invoices,
            SUM(net_dom_amount) as total_val
        FROM invoice_output 
        WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != ''
        GROUP BY TRIM(catalog_group);
    """)
    ifs_groups = cur.fetchall()
    print(f"Total distinct Catalog Groups in invoice_output: {len(ifs_groups)}")

    # 5. What is in invoice_output but NOT in all_page_sgs?
    unmapped_ifs = []
    for g in ifs_groups:
        if g['ifs_group'].lower() not in all_page_sgs:
            unmapped_ifs.append(g)

    print(f"Unmapped IFS groups (not in page sales groups): {len(unmapped_ifs)}")
    for u in unmapped_ifs:
        print(f"  - {u['ifs_group']} | {u['items']} items | {u['invoices']} invs | Rs. {u['total_val']:,.2f}")

    # 6. Check 'UPLOAD NOT INCLUDE' card (not_in_budget)
    cur.execute("""
        SELECT DISTINCT TRIM(sales_group) as sg 
        FROM total_budget 
        WHERE (COALESCE(total, 0) = 0 OR product_sku = 'Unbudgeted (Excel)');
    """)
    not_in_budget = cur.fetchall()
    print(f"Total Not in Budget items (Card 5): {len(not_in_budget)}")
    print("Not in budget items:", [r['sg'] for r in not_in_budget])

conn.close()
''')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('/var/www/dashboard/backend/.venv/bin/python3 /tmp/debug_groups.py')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
