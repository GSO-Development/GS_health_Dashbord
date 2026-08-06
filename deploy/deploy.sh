#!/bin/bash
# GSH Dashboard - VPS Deployment Script
# Run as root or with sudo on Ubuntu server
# Usage: sudo bash deploy.sh

set -e  # Exit on any error

REPO_URL="https://github.com/sljohnsge-sudo/Dash-borad.git"
APP_DIR="/var/www/dashboard"
BRANCH="main"

echo "======================================================"
echo "  GSH Dashboard - Deployment Script"
echo "======================================================"

# ── 1. System Dependencies ─────────────────────────────────
echo "[1/8] Installing system dependencies..."
apt-get update -qq
apt-get install -y -qq git python3 python3-venv python3-pip nodejs npm nginx curl

# Install Node 20 LTS if not already installed
node_version=$(node -v 2>/dev/null | cut -d'v' -f2 | cut -d'.' -f1 || echo "0")
if [ "$node_version" -lt "18" ]; then
    echo "  -> Installing Node.js 20 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt-get install -y nodejs
fi

echo "  -> Node: $(node -v), npm: $(npm -v), Python: $(python3 --version)"

# ── 2. Clone / Pull Repository ─────────────────────────────
echo "[2/8] Setting up repository..."
if [ -d "$APP_DIR/.git" ]; then
    echo "  -> Pulling latest changes..."
    cd "$APP_DIR"
    git fetch origin
    git reset --hard origin/$BRANCH
else
    echo "  -> Cloning repository..."
    mkdir -p /var/www
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
    git checkout $BRANCH
fi

# ── 3. Python Backend Setup ────────────────────────────────
echo "[3/8] Setting up Python virtual environment..."
cd "$APP_DIR"
python3 -m venv .venv
.venv/bin/pip install --upgrade pip -q
.venv/bin/pip install -r backend/requirements.txt -q
echo "  -> Backend dependencies installed."

# ── 4. Backend .env Configuration ─────────────────────────
echo "[4/8] Configuring backend environment..."
if [ ! -f "$APP_DIR/backend/.env" ]; then
    cat > "$APP_DIR/backend/.env" << 'EOF'
MYSQL_HOST=localhost
MYSQL_PORT=3306
MYSQL_USER=dashboard_admin
MYSQL_PASSWORD=Test#123
MYSQL_DB=gsh_dashboard
APP_SECRET_KEY=gsh_dashboard_secret_2026
EOF
    echo "  -> .env created at $APP_DIR/backend/.env"
else
    echo "  -> .env already exists, skipping."
fi

# ── 5. Frontend Build ──────────────────────────────────────
echo "[5/8] Building React frontend..."
cd "$APP_DIR/frontend"

# Create production .env for frontend
cat > .env.production << EOF
VITE_API_URL=/api
EOF

npm install --silent
npm run build
echo "  -> Frontend built at $APP_DIR/frontend/dist"

# ── 6. Systemd Service ─────────────────────────────────────
echo "[6/8] Installing systemd service..."
cp "$APP_DIR/deploy/dashboard.service" /etc/systemd/system/dashboard.service
systemctl daemon-reload
systemctl enable dashboard
systemctl restart dashboard
echo "  -> Backend service started."
sleep 2
systemctl status dashboard --no-pager | head -20

# ── 7. Nginx Configuration ─────────────────────────────────
echo "[7/8] Configuring Nginx..."
cp "$APP_DIR/nginx/dashboard.conf" /etc/nginx/sites-available/dashboard
ln -sf /etc/nginx/sites-available/dashboard /etc/nginx/sites-enabled/dashboard
# Remove default site if present
rm -f /etc/nginx/sites-enabled/default

nginx -t
systemctl enable nginx
systemctl restart nginx
echo "  -> Nginx configured and restarted."

# ── 8. File Permissions ────────────────────────────────────
echo "[8/8] Setting file permissions..."
chown -R www-data:www-data "$APP_DIR"
chmod -R 755 "$APP_DIR/frontend/dist"
echo "  -> Permissions set."

echo ""
echo "======================================================"
echo "  Deployment Complete!"
echo "======================================================"
echo "  Frontend: http://$(hostname -I | awk '{print $1}')"
echo "  Backend:  http://$(hostname -I | awk '{print $1}')/api/health"
echo ""
echo "  Service logs: journalctl -u dashboard -f"
echo "  Nginx logs:   tail -f /var/log/nginx/error.log"
echo "======================================================"
