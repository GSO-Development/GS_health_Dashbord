import paramiko
import os

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123', timeout=10)

sftp = ssh.open_sftp()
try:
    sftp.mkdir('/tmp/dist')
except Exception:
    pass
try:
    sftp.mkdir('/tmp/dist/assets')
except Exception:
    pass

local_dist = r'd:\new_GS\GS_health_Dashbord\frontend\dist'

# Upload index.html
sftp.put(os.path.join(local_dist, 'index.html'), '/tmp/dist/index.html')

# Upload assets
local_assets = os.path.join(local_dist, 'assets')
for item in os.listdir(local_assets):
    print(f"Uploading {item} to /tmp/dist/assets/{item}...")
    sftp.put(os.path.join(local_assets, item), f'/tmp/dist/assets/{item}')

# Upload division_mappings.py
sftp.put(r'd:\new_GS\GS_health_Dashbord\backend\app\routers\division_mappings.py', '/tmp/division_mappings.py')
sftp.close()

# Copy to destination with sudo
cmd = '''
echo "Test#123" | sudo -S cp -r /tmp/dist/* /var/www/dashboard/frontend/dist/
echo "Test#123" | sudo -S cp /tmp/division_mappings.py /var/www/dashboard/backend/app/routers/division_mappings.py
echo "Test#123" | sudo -S chown -R www-data:www-data /var/www/dashboard/frontend/dist
echo "Test#123" | sudo -S systemctl restart dashboard.service
echo "Test#123" | sudo -S systemctl restart nginx
'''
stdin, stdout, stderr = ssh.exec_command(cmd)
print("Output:\n", stdout.read().decode())
print("Error:\n", stderr.read().decode())

ssh.close()
print("Deployment to VPS completed successfully!")
