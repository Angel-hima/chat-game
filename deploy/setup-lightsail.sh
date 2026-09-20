#!/bin/bash
set -e

echo "=========================================="
echo " 🚀 雑談ゲーム AWS Lightsail 自動セットアップ"
echo "=========================================="

# 1. システムパッケージ更新
echo "📦 システム更新と必要なツールのインストール中..."
sudo apt-get update -y
sudo apt-get install -y curl git ufw

# 2. Node.js 20.x のインストール（NodeSource）
if ! command -v node &> /dev/null; then
    echo "🟢 Node.js 20.x をインストール中..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
    sudo apt-get install -y nodejs
fi
echo "Node.js バージョン: $(node -v)"
echo "npm バージョン: $(npm -v)"

# 3. PM2 のインストール
if ! command -v pm2 &> /dev/null; then
    echo "⚙️ PM2 (常時稼働プロセスマネージャ) をインストール中..."
    sudo npm install -g pm2
fi

# 4. プロジェクトのディレクトリ確認
cd "$(dirname "$0")/.."
PROJECT_ROOT=$(pwd)
echo "プロジェクトディレクトリ: $PROJECT_ROOT"

# 5. クライアントのビルド (Web配信アセット生成)
echo "💻 Webクライアントをビルド中..."
cd "$PROJECT_ROOT/client"
npm install
npm run build

# 6. サーバーのビルド
echo "🖥️ サーバーをビルド中..."
cd "$PROJECT_ROOT/server"
npm install
npm run build

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