#!/bin/bash
set -e

# UTF-8 ロケール設定
export LC_ALL=C.UTF-8
export LANG=C.UTF-8

echo "=========================================="
echo " >> Chat Game AWS Lightsail Setup"
echo "=========================================="

# 1. System packages update
echo "[1/7] Updating system packages..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw

# 2. Swap memory (2GB) setup for stability
if [ ! -f /swapfile ]; then
    echo "[2/7] Creating 2GB swap memory..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab || true
    echo ">> Swap memory created."
fi

# 3. Install Node.js 20.x
if ! command -v node &> /dev/null; then
    echo "[3/7] Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js: $(node -v), npm: $(npm -v)"

# 4. Install PM2
if ! command -v pm2 &> /dev/null; then
    echo "[4/7] Installing PM2 process manager..."
    sudo npm install -g pm2
fi

# 5. Project directory
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)

# 6. Prepare Client
cd "$PROJECT_ROOT/client"
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "[5/7] Building Web client..."
    npm install
    npm run build
else
    echo "[5/7] Using pre-built Web client (OK)"
fi

# 7. Prepare Server
echo "[6/7] Preparing Server..."
cd "$PROJECT_ROOT/server"
npm install --production || npm install
if [ ! -f "dist/server.js" ]; then
    npm run build
fi

# 8. Start PM2 daemon
echo "[7/7] Starting game server with PM2..."
pm2 start ecosystem.config.cjs || pm2 restart ecosystem.config.cjs
pm2 save

# 9. Auto-restart on reboot
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true

# 10. Firewall rule
sudo ufw allow 3010/tcp || true
sudo ufw allow 80/tcp || true

PUBLIC_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo " [SUCCESS] Setup Completed Successfully! "
echo "=========================================="
echo "Open in your browser / iPad:"
echo ">> http://$PUBLIC_IP:3010"
echo "=========================================="