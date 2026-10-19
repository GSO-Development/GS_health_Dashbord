import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

stdin, stdout, stderr = ssh.exec_command('echo "Test#123" | sudo -S systemctl list-unit-files | grep -iE "uvicorn|gsh|dash|fastapi|backend"')
print("Unit files:\n", stdout.read().decode('utf-8', errors='ignore'))

stdin, stdout, stderr = ssh.exec_command('systemctl status gsh-backend dashboard-backend fastapi uvicorn backend 2>&1')
print("Status:\n", stdout.read().decode('utf-8', errors='ignore'))

ssh.close()
