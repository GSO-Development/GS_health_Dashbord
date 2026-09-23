import paramiko

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect('172.16.7.10', username='tmsadmin', password='Test#123')

remote_code = """
import urllib.request
import json

host = "http://127.0.0.1:8000"

def get_json(url):
    req = urllib.request.Request(url)
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read().decode())

tr = get_json(host + "/api/reports/total-range-fy?month=september&backlog_mode=without")
print("total-range-fy (September) summary_totals:", tr.get("summary_totals"))
"""

sftp = ssh.open_sftp()
with sftp.file('/tmp/check_tr_sum.py', 'w') as f:
    f.write(remote_code)
sftp.close()

stdin, stdout, stderr = ssh.exec_command('python3 /tmp/check_tr_sum.py')
print(stdout.read().decode())
print(stderr.read().decode())
ssh.close()
