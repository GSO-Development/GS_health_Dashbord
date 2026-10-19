import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

sftp = ssh.open_sftp()
with sftp.file('/tmp/test_unmapped_query.py', 'w') as f:
    f.write('''
import sys
import time
sys.path.insert(0, '/var/www/dashboard/backend')
from app.core.database import get_db_connection

t0 = time.time()
conn = get_db_connection()
with conn.cursor() as cur:
    # 1. Get all mapped sales groups from division_mappings
    cur.execute("SELECT LOWER(TRIM(sales_group)) as sg FROM division_mappings WHERE sales_group IS NOT NULL AND TRIM(sales_group) != '';")
    mapped_sgs = set(r['sg'] for r in cur.fetchall() if r['sg'])

    # 2. Get unmapped groups summary
    cur.execute("""
        SELECT 
            TRIM(catalog_group) as sales_group,
            COUNT(DISTINCT catalog_no) as item_count,
            COUNT(*) as invoice_count,
            SUM(net_dom_amount) as total_net_amount,
            GROUP_CONCAT(DISTINCT TRIM(contract) SEPARATOR ', ') as contracts
        FROM invoice_output
        WHERE catalog_group IS NOT NULL AND TRIM(catalog_group) != ''
        GROUP BY TRIM(catalog_group)
        ORDER BY total_net_amount DESC;
    """)
    all_ifs = cur.fetchall()
    
    unmapped_groups = []
    for g in all_ifs:
        if g['sales_group'].lower() not in mapped_sgs:
            unmapped_groups.append(g)

    print(f"Query completed in {time.time() - t0:.2f}s")
    print(f"Unmapped groups count: {len(unmapped_groups)}")
    total_val = sum(g['total_net_amount'] or 0 for g in unmapped_groups)
    total_items = sum(g['item_count'] or 0 for g in unmapped_groups)
    print(f"Total unmapped value: LKR {total_val:,.2f}, Total items: {total_items}")

    # 3. Test item details for unmapped groups
    unmapped_sg_names = [g['sales_group'] for g in unmapped_groups]
    if unmapped_sg_names:
        placeholders = ', '.join(['%s'] * len(unmapped_sg_names))
        cur.execute(f"""
            SELECT 
                TRIM(catalog_group) as sales_group,
                TRIM(catalog_no) as catalog_no,
                MAX(TRIM(description)) as description,
                TRIM(contract) as contract,
                SUM(invoiced_qty) as total_qty,
                AVG(calculated_unit_price) as avg_unit_price,
                SUM(net_dom_amount) as total_net_amount,
                COUNT(*) as invoice_count
            FROM invoice_output
            WHERE TRIM(catalog_group) IN ({placeholders})
            GROUP BY TRIM(catalog_group), TRIM(catalog_no), TRIM(contract)
            ORDER BY total_net_amount DESC
            LIMIT 10;
        """, unmapped_sg_names)
        items = cur.fetchall()
        print("Sample 10 items:")
        for it in items:
            print(f"  [{it['sales_group']}] {it['catalog_no']} - {it['description'][:30]} | Qty: {it['total_qty']} | Avg Price: {it['avg_unit_price']:,.2f} | Net: {it['total_net_amount']:,.2f}")

conn.close()
''')
sftp.close()

stdin, stdout, stderr = ssh.exec_command('/var/www/dashboard/backend/.venv/bin/python3 /tmp/test_unmapped_query.py')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
