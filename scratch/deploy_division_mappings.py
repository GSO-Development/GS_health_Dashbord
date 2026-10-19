import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

sftp = ssh.open_sftp()
local_file = r'd:\new_GS\GS_health_Dashbord\backend\app\routers\division_mappings.py'
remote_file = '/var/www/dashboard/backend/app/routers/division_mappings.py'

sftp.put(local_file, remote_file)
sftp.close()

# Restart backend service on VPS
stdin, stdout, stderr = ssh.exec_command('echo "Test#123" | sudo -S systemctl restart dashboard-backend')
stdout.channel.recv_exit_status()

# Test endpoint via curl
stdin, stdout, stderr = ssh.exec_command('curl -s http://127.0.0.1:8000/api/division-mappings/unmapped-ifs-summary | head -c 500')
res = stdout.read().decode()
print("Endpoint response:\n", res)

ssh.close()
