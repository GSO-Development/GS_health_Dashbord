# 🚀 George Steuart Health Dashboard - Complete Server Deployment & Update Guide

මෙම ලේඛනයෙහි **GSH Executive Health Dashboard** පද්ධතිය Production Server (VPS) වෙත මුල සිට Deploy කළ ආකාරය සහ ඉදිරියට සිදුකරන **නව Updates (New Releases / Bug Fixes)** පහසුවෙන් Server එකට යොදන ආකාරය පියවරෙන් පියවර විස්තර කර ඇත.

---

## 📌 1. Server & System Architecture Overview

| Component | Specification / Configuration |
|---|---|
| **Server Host IP** | `172.16.7.10` |
| **Domain / URL** | `http://gsh-sd.georgesteuart.lk` (Local Network) |
| **SSH User** | `tmsadmin` |
| **Project Directory** | `/var/www/dashboard` |
| **Backend Directory** | `/var/www/dashboard/backend` |
| **Frontend Directory** | `/var/www/dashboard/frontend` |
| **Backend Service** | `dashboard.service` (Systemd / Uvicorn ASGI on Port 8000) |
| **Web Server / Reverse Proxy** | Nginx (Port 80) serving `/frontend/dist` & proxying `/api` |
| **Database** | MySQL (Database: `gsh_dashboard` on Port 3306) |
| **External Integrations** | Oracle ERP Database (Live Invoices & Backlog), Axienta Distributor Cloud |

---

## 🔐 Default System Login Credentials (පෙරනිමි පරිශීලක ගිණුම්)

| Account Role | Username | Email | Password | Permissions / Access |
|---|---|---|---|---|
| **🛡️ Admin** | `admin` | `admin@gsh.lk` | `Admin@GSH2026!` | සම්පූර්ණ පාලන පහසුකම් (Formula Guides, User Management, Oracle/Axienta Sync, Budget Upload, Mappings) |
| **👤 Standard User** | `user` | `user@gsh.lk` | `User@GSH2026!` | Dashboard Executive Viewer Access (View Charts, Reports, Backlog Filters) |
| **🏢 Microsoft SSO** | Corporate Email | `name@georgesteuart.lk` | (Office 365 Password) | Microsoft Entra ID (Azure AD) Single Sign-On මගින් login වීම |

---

## 🛠️ 2. Initial Server Setup & Deployment Steps (මුල් ස්ථාපනය කළ ආකාරය)

### පියවර 1: Server Prerequisites & System Packages ස්ථාපනය කිරීම
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx mysql-server git libaio1 libaio-dev curl
```

### පියවර 2: Oracle Instant Client ස්ථාපනය කිරීම (Oracle DB Integration සඳහා)
Oracle ERP වෙතින් සජීවී Invoices සහ Backlog Data ලබා ගැනීමට Oracle Client Drivers අවශ්‍ය වේ:
```bash
# 1. Oracle Instant Client files extract කිරීම
sudo mkdir -p /opt/oracle
cd /opt/oracle
# (instantclient-basic-linux.x64-19.x.zip extract කරනු ලැබේ)

# 2. Environment Variables & Library path configure කිරීම
echo "/opt/oracle/instantclient_19_24" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
sudo ldconfig

# Ubuntu 24.04+ සඳහා libaio symlink fix:
sudo ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 || true
sudo ldconfig
```

---

### පියවර 3: Project Directory එක සැකසීම සහ Code Clone කිරීම
```bash
sudo mkdir -p /var/www/dashboard
sudo chown -R $USER:$USER /var/www/dashboard

# Repository එක Clone කිරීම හෝ Files copy කිරීම
cd /var/www/dashboard
# (Codebase copied into /var/www/dashboard)
```

---

### පියවර 4: Backend Virtual Environment & Dependencies Setup
```bash
cd /var/www/dashboard/backend

# Virtual environment සෑදීම
python3 -m venv .venv
source .venv/bin/activate

# Python packages ස්ථාපනය
pip install --upgrade pip
pip install -r requirements.txt
```

#### Backend Environment File (`/var/www/dashboard/backend/.env`):
```env
DB_HOST=127.0.0.1
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=gsh_dashboard

ORACLE_USER=YOUR_ORACLE_USER
ORACLE_PASSWORD=YOUR_ORACLE_PASSWORD
ORACLE_DSN=172.16.x.x:1521/ORCL
AXIENTA_API_URL=https://api.axienta.lk
```

---

### පියවර 5: Systemd Background Service එක Configure කිරීම
Backend එක background process එකක් ලෙස 24/7 ක්‍රියාත්මක වීමට Systemd Unit එකක් නිර්මාණය කරන ලදී:

File Location: `/etc/systemd/system/dashboard.service`
```ini
[Unit]
Description=GSH Dashboard FastAPI Backend Server
After=network.target mysql.service

[Service]
User=root
WorkingDirectory=/var/www/dashboard/backend
ExecStart=/var/www/dashboard/backend/.venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8000 --workers 4
Restart=always
RestartSec=5
EnvironmentFile=/var/www/dashboard/backend/.env

[Install]
WantedBy=multi-user.target
```

Service එක Enable සහ Start කිරීම:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dashboard
sudo systemctl restart dashboard
sudo systemctl status dashboard
```

---

### පියවර 6: Frontend Build & Nginx Configuration

#### Frontend Environment File (`/var/www/dashboard/frontend/.env.production`):
```env
VITE_API_URL=/api
```

#### Frontend Bundle එක Build කිරීම:
```bash
cd /var/www/dashboard/frontend
npm install
npm run build
```
*(Build files `/var/www/dashboard/frontend/dist` තුළ generate වේ)*

#### Nginx Site Configuration (`/etc/nginx/sites-available/dashboard`):
```nginx
server {
    listen 80;
    server_name gsh-sd.georgesteuart.lk 172.16.7.10;

    # Frontend Static Single Page App (SPA)
    root /var/www/dashboard/frontend/dist;
    index index.html;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # FastAPI Backend Reverse Proxy
    location /api/ {
        proxy_pass http://127.0.0.1:8000/api/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_read_timeout 300s;
        proxy_connect_timeout 300s;
    }
}
```

Site එක Activate කර Nginx Restart කිරීම:
```bash
sudo ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔄 3. How to Deploy New Updates to Server (අලුත් Update එකක් Server එකට දමන ආකාරය)

ඔබ Local Computer එකේ Code වෙනස්කම් කර පසුව ඒවා Server එකට Deploy කිරීමට පහත පියවර අනුගමනය කරන්න.

### ක්‍රමය 1: Manual Step-by-Step Deployment

#### පියවර A: Local PC එකෙන් Server එකට SSH මගින් සම්බන්ධ වන්න
```bash
ssh tmsadmin@172.16.7.10
# Password: (Enter server password)
```

#### පියවර B: නවතම Code Updates ලබා ගැනීම (Pull Latest Code)
```bash
cd /var/www/dashboard
git pull origin main
```
*(Git භාවිතා නොකරන්නේ නම්, SFTP/SCP මගින් වෙනස් කළ files `/var/www/dashboard/` වෙත upload කරන්න)*

#### පියවර C: Backend එක Update කර Restart කිරීම
```bash
cd /var/www/dashboard/backend
source .venv/bin/activate

# නව Python packages ඇත්නම් install කරගැනීම
pip install -r requirements.txt

# Backend service එක restart කිරීම
sudo systemctl restart dashboard
```

#### පියවර D: Frontend එක Rebuild කර Nginx Reload කිරීම
```bash
cd /var/www/dashboard/frontend

# නව NPM packages ඇත්නම් install කරගැනීම
npm install

# Production build එක සෑදීම
npm run build

# Nginx web server reload කිරීම
sudo systemctl reload nginx
```

#### පියවර E: Update එක සාර්ථකදැයි Health Check කිරීම
```bash
# Backend Health Endpoint එක පරීක්ෂා කිරීම
curl -s http://127.0.0.1:8000/api/health

# Dashboard service status බැලීම
sudo systemctl status dashboard --no-pager
```

---

### ක්‍රමය 2: Automated 1-Click Update Script (ඉතා පහසු ක්‍රමය)

Server එක තුළ Update එක එකම command එකකින් run කිරීමට `deploy.sh` script එකක් සකස් කර ඇත.

#### Server එක තුළ `deploy.sh` script එක සාදාගන්න:
```bash
sudo nano /var/www/dashboard/deploy.sh
```

පහත code එක paste කරන්න:
```bash
#!/bin/bash
set -e

echo "=========================================="
echo "🚀 Starting GSH Dashboard Production Deploy"
echo "=========================================="

cd /var/www/dashboard

# 1. Pull latest code
echo "📥 1. Pulling latest git updates..."
git pull origin main || echo "⚠️ Git pull skipped or not configured."

# 2. Update Backend
echo "⚙️ 2. Updating Backend..."
cd /var/www/dashboard/backend
source .venv/bin/activate
pip install -r requirements.txt --quiet
sudo systemctl restart dashboard

# 3. Update Frontend
echo "📦 3. Building Frontend Assets..."
cd /var/www/dashboard/frontend
npm install --silent
npm run build
sudo systemctl reload nginx

# 4. Verification
echo "🩺 4. Verifying Health Status..."
sleep 2
HEALTH=$(curl -s http://127.0.0.1:8000/api/health)
echo "Backend Status: $HEALTH"

echo "=========================================="
echo "✅ Deployment Completed Successfully!"
echo "🌐 Dashboard URL: http://gsh-sd.georgesteuart.lk"
echo "=========================================="
```

Script එකට Execute Permission දෙන්න:
```bash
sudo chmod +x /var/www/dashboard/deploy.sh
```

#### ඉදිරියට Update එකක් දැමීමට අවශ්‍ය වූ විට run කළ යුතු එකම Command එක:
```bash
sudo /var/www/dashboard/deploy.sh
```

---

## 📋 4. Common Troubleshooting & Useful Commands

| Action | Command |
|---|---|
| **Backend Logs Live බැලීම** | `sudo journalctl -u dashboard -f` |
| **Nginx Error Logs බැලීම** | `sudo tail -f /var/log/nginx/error.log` |
| **Backend Service Restart කිරීම** | `sudo systemctl restart dashboard` |
| **Nginx Reload කිරීම** | `sudo systemctl reload nginx` |
| **MySQL Status බැලීම** | `sudo systemctl status mysql` |
| **Port 8000 Listen වෙනවාද බැලීම** | `sudo netstat -tulpn \| grep 8000` |
