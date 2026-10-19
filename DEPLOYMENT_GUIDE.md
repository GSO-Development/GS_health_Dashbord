# 🚀 George Steuart Health Dashboard - Complete Server Deployment & Update Guide

This document provides a comprehensive, step-by-step guide on how the **GSH Executive Health Dashboard** was deployed from scratch to the Production Server (VPS), as well as instructions for deploying future **updates, new releases, and bug fixes**.

---

## 📌 1. Server & System Architecture Overview

| Component | Specification / Configuration |
|---|---|
| **Server Host IP** | `172.16.7.10` |
| **Domain / URL** | `http://gsh-sd.georgesteuart.lk` (Local Corporate Network) |
| **SSH User** | `tmsadmin` |
| **Project Root Directory** | `/var/www/dashboard` |
| **Backend Directory** | `/var/www/dashboard/backend` |
| **Frontend Directory** | `/var/www/dashboard/frontend` |
| **Backend Service** | `dashboard.service` (Systemd / Uvicorn ASGI on Port 8000) |
| **Web Server / Reverse Proxy** | Nginx (Port 80) serving `/frontend/dist` & proxying `/api` |
| **Database** | MySQL (Database: `gsh_dashboard` on Port 3306) |
| **External Integrations** | Oracle ERP Database (Live Invoices & Backlog), Axienta Distributor Cloud |

---

## 🔐 Default System Login Credentials

| Account Role | Username | Email | Password | Permissions / Access |
|---|---|---|---|---|
| **🛡️ Admin** | `admin` | `admin@gsh.lk` | `Admin@GSH2026!` | Full Administrative Privileges (Formula Guides, User Management, Oracle/Axienta Sync, Budget Upload, Mappings) |
| **👤 Standard User** | `user` | `user@gsh.lk` | `User@GSH2026!` | Dashboard Executive Viewer Access (View Charts, Reports, Backlog Filters) |
| **🏢 Microsoft SSO** | Corporate Email | `name@georgesteuart.lk` | (Office 365 Password) | Microsoft Entra ID (Azure AD) Single Sign-On Authentication |

---

## 🛠️ 2. Initial Server Setup & Deployment Steps

### Step 1: Install Server Prerequisites & System Packages
```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y python3 python3-pip python3-venv nodejs npm nginx mysql-server git libaio1 libaio-dev curl
```

### Step 2: Install Oracle Instant Client (For Oracle DB Integration)
Oracle Client drivers are required to connect directly to the Oracle ERP database for live Invoices and Backlog data retrieval:
```bash
# 1. Create directory and extract Oracle Instant Client files
sudo mkdir -p /opt/oracle
cd /opt/oracle
# (Extract instantclient-basic-linux.x64-19.x.zip into /opt/oracle)

# 2. Configure Environment Variables & Library path
echo "/opt/oracle/instantclient_19_24" | sudo tee /etc/ld.so.conf.d/oracle-instantclient.conf
sudo ldconfig

# Symlink fix for libaio on Ubuntu 24.04+:
sudo ln -s /usr/lib/x86_64-linux-gnu/libaio.so.1t64 /usr/lib/x86_64-linux-gnu/libaio.so.1 || true
sudo ldconfig
```

---

### Step 3: Setup Project Directory & Clone Codebase
```bash
sudo mkdir -p /var/www/dashboard
sudo chown -R $USER:$USER /var/www/dashboard

# Clone Repository or Copy Files
cd /var/www/dashboard
# (Copy or clone codebase into /var/www/dashboard)
```

---

### Step 4: Backend Virtual Environment & Dependencies Setup
```bash
cd /var/www/dashboard/backend

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate

# Install Python packages
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

### Step 5: Configure Systemd Background Service
To keep the FastAPI backend running continuously 24/7 as a managed system service, create a Systemd unit file:

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

Enable and Start the Service:
```bash
sudo systemctl daemon-reload
sudo systemctl enable dashboard
sudo systemctl restart dashboard
sudo systemctl status dashboard
```

---

### Step 6: Frontend Build & Nginx Configuration

#### Frontend Environment File (`/var/www/dashboard/frontend/.env.production`):
```env
VITE_API_URL=/api
```

#### Build Frontend Production Bundle:
```bash
cd /var/www/dashboard/frontend
npm install
npm run build
```
*(The production build assets are output into `/var/www/dashboard/frontend/dist`)*

#### Nginx Site Configuration (`/etc/nginx/sites-available/dashboard`):
```nginx
server {
    listen 80;
    server_name gsh-sd.georgesteuart.lk 172.16.7.10;

    # Frontend Static Single Page Application (SPA)
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

Enable Site and Restart Nginx:
```bash
sudo ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

---

## 🔄 3. How to Deploy New Updates to the Server

Whenever you modify code locally and need to deploy changes to the live production server, follow one of the two methods below.

### Method 1: Manual Step-by-Step Deployment

#### Step A: Connect to Server via SSH
```bash
ssh tmsadmin@172.16.7.10
# Enter password when prompted
```

#### Step B: Pull Latest Code Changes
```bash
cd /var/www/dashboard
git pull origin main
```
*(If Git is not configured, copy the updated files to `/var/www/dashboard/` via SFTP/SCP)*

#### Step C: Update Backend and Restart Service
```bash
cd /var/www/dashboard/backend
source .venv/bin/activate

# Install any newly added Python packages
pip install -r requirements.txt

# Restart the FastAPI backend service
sudo systemctl restart dashboard
```

#### Step D: Rebuild Frontend and Reload Nginx
```bash
cd /var/www/dashboard/frontend

# Install any newly added NPM packages
npm install

# Rebuild the production bundle
npm run build

# Reload the Nginx web server
sudo systemctl reload nginx
```

#### Step E: Verify Deployment Health
```bash
# Check Backend Health Endpoint
curl -s http://127.0.0.1:8000/api/health

# Check Dashboard system service status
sudo systemctl status dashboard --no-pager
```

---

### Method 2: Automated 1-Click Update Script (Recommended)

To deploy updates in one single command, an automated deployment script `deploy.sh` is configured on the server.

#### Create `deploy.sh` on the Server:
```bash
sudo nano /var/www/dashboard/deploy.sh
```

Paste the following script content:
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

Grant Execute Permissions to the Script:
```bash
sudo chmod +x /var/www/dashboard/deploy.sh
```

#### Deploying Any Future Update:
Run this single command whenever you want to update the server:
```bash
sudo /var/www/dashboard/deploy.sh
```

---

## 📋 4. Common Troubleshooting & Useful Commands

| Action | Command |
|---|---|
| **View Live Backend Logs** | `sudo journalctl -u dashboard -f` |
| **View Nginx Error Logs** | `sudo tail -f /var/log/nginx/error.log` |
| **Restart Backend Service** | `sudo systemctl restart dashboard` |
| **Reload Nginx Server** | `sudo systemctl reload nginx` |
| **Check MySQL Service Status** | `sudo systemctl status mysql` |
| **Check Port 8000 Activity** | `sudo netstat -tulpn \| grep 8000` |
| **Check Oracle Driver Configuration** | `ldconfig -p \| grep libclntsh` |
| **Test Backend Health Endpoint** | `curl -s http://127.0.0.1:8000/api/health` |
