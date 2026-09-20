#!/bin/bash
set -e

echo "=========================================="
echo " 🚀 雑談ゲーム AWS Lightsail 自動セットアップ"
echo "=========================================="

# 1. システムパッケージ更新
echo "📦 システム更新と必要なツールのインストール中..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw

# 2. スワップメモリ（2GB）の設定（512MB RAMのフリーズ防止）
if [ ! -f /swapfile ]; then
    echo "💾 スワップメモリ（2GB）を作成中（メモリ不足防止）..."
    sudo fallocate -l 2G /swapfile || sudo dd if=/dev/zero of=/swapfile bs=1M count=2048
    sudo chmod 600 /swapfile
    sudo mkswap /swapfile
    sudo swapon /swapfile
    echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab || true
    echo "✅ スワップメモリ作成完了"
fi

# 3. Node.js 20.x のインストール（NodeSource）
if ! command -v node &> /dev/null; then
    echo "🟢 Node.js 20.x をインストール中..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js バージョン: $(node -v)"
echo "npm バージョン: $(npm -v)"

# 4. PM2 のインストール
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ PM2 (常時稼働プロセスマネージャ) をインストール中..."
    sudo npm install -g pm2
fi

# 5. プロジェクトのディレクトリ確認
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo "プロジェクトディレクトリ: $PROJECT_ROOT"

# 6. クライアントの確認とビルド
cd "$PROJECT_ROOT/client"
if [ ! -d "dist" ] || [ ! -f "dist/index.html" ]; then
    echo "💻 Webクライアントをビルド中..."
    npm install
    npm run build
else
    echo "✅ ビルド済みWebクライアント(dist)が存在するためビルドをスキップします"
fi

# 7. サーバーの準備と起動
echo "🖥️ サーバーの準備中..."
cd "$PROJECT_ROOT/server"
npm install --production || npm install
if [ ! -f "dist/server.js" ]; then
    npm run build
fi

# 7. PM2 でサーバーを起動
echo "🔥 サーバーを常時稼働プロセスとして起動中..."
pm2 start ecosystem.config.cjs || pm2 restart ecosystem.config.cjs
pm2 save

# 8. OS起動時の自動復帰設定
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME || true

# 9. ファイアウォール (ポート3010) の開放
sudo ufw allow 3010/tcp || true
sudo ufw allow 80/tcp || true

PUBLIC_IP=$(curl -s ifconfig.me || hostname -I | awk '{print $1}')

echo ""
echo "=========================================="
echo " 🎉 セットアップが完了しました！"
echo "=========================================="
echo "ブラウザで以下のURLを開いてゲームを遊べます："
echo "👉 http://$PUBLIC_IP:3010"
echo ""
echo "※iPadやスマホ、PCから上記のURLを開くだけで自動接続されます。"
echo "※PM2の稼働状況を確認するには: pm2 status"
echo "※ログを確認するには: pm2 logs"
echo "=========================================="