import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('echo "Test#123" | sudo -S systemctl restart dashboard.service')
stdout.channel.recv_exit_status()

stdin, stdout, stderr = ssh.exec_command('''/var/www/dashboard/backend/.venv/bin/python3 -c "
import urllib.request
import json

for path in ['/api/division-mappings/unmapped-ifs-summary', '/api/division-mappings/unmapped-ifs-items?limit=3']:
    try:
        req = urllib.request.Request(f'http://127.0.0.1:8000{path}')
        with urllib.request.urlopen(req) as resp:
            data = json.loads(resp.read().decode())
            print(path, '-> Status:', resp.status)
            print('  Keys:', list(data.keys()))
            if 'total_unmapped_groups' in data:
                print('  Total unmapped groups:', data['total_unmapped_groups'], 'Value:', data['total_unmapped_value'])
            if 'items' in data:
                print('  Items count:', len(data['items']), 'Total:', data['total_count'])
    except Exception as e:
        print(path, '-> Error:', e)
"''')
print(stdout.read().decode('utf-8', errors='ignore'))
print(stderr.read().decode('utf-8', errors='ignore'))
ssh.close()
