#!/bin/bash
# GSH Dashboard - Update Script (run after new GitHub pushes)
# Usage: sudo bash update.sh

set -e

APP_DIR="/var/www/dashboard"
BRANCH="main"

echo "[1/4] Pulling latest code from GitHub..."
cd "$APP_DIR"
git fetch origin
git reset --hard origin/$BRANCH

echo "[2/4] Updating Python dependencies..."
.venv/bin/pip install -r backend/requirements.txt -q

echo "[3/4] Rebuilding frontend..."
cd "$APP_DIR/frontend"
npm install --silent
npm run build

echo "[4/4] Restarting backend service..."
systemctl restart dashboard

echo ""
echo "Update complete! Site is live."
echo "Service status: $(systemctl is-active dashboard)"
