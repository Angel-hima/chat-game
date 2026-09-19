# 雑談パーティー！ (Chat Game) 💬🎉

Android、Windows、iOS、およびWebブラウザで動作するクロスプラットフォームのオンライン雑談ゲームです。
部屋機能（公開部屋 / 非公開合言葉部屋）を完備し、マルチデバイスでリアルタイムに雑談とお題トーク・心理推理ゲームを楽しめます。

---

## 🌟 主な機能

1. **ルーム（部屋）機能**
   - **公開部屋（パブリック）**: ロビーの公開部屋一覧にリアルタイム表示。誰でもワンタップで参加可能！
   - **プライベート部屋**: 合言葉（パスワード）や5桁の英数字ルームコードで友達同士のみで遊べる部屋。
   - **待機ロビー**: 参加者リスト、プレイヤー名・アバター変更、ホスト交代、準備完了（READY）機能。
2. **ゲームシステム**
   - **お題トークモード**: 「人生で一番笑った話」「宝くじで3億当たったら？」など多種多様なトークテーマが自動出現。タイマー＆サイコロ（お題引き直し）機能付き。
   - **ワードウルフモード**: 1人だけ微妙に違うお題を持つ「ウルフ」を雑談しながら探し出す人気ゲーム。配役自動割り当て、雑談タイマー、投票、結果発表＆紙吹雪演出付き。
3. **リアルタイム・リアクション & チャット**
   - 「わかる！」「それな！」「👏」「草w」「えー！？」「神！」などのワンタップスタンプが画面いっぱいにぷかぷか浮き上がる弾幕エフェクト！
   - リアルタイムチャット欄。
4. **マルチプラットフォーム対応**
   - **Windows**: ダブルクリックで即起動する実行ファイル（`.exe`）
   - **Android**: Capacitor経由でAndroid Studioプロジェクト / APKを生成
   - **iOS**: Xcodeプロジェクトのひな形を出力済み
   - **Webブラウザ**: 同一Wi-Fi上のPCやスマートフォンからブラウザでアクセスするだけでもプレイ可能！

---

## 📁 ディレクトリ構成

```text
chat-game/
├── server/                 # リアルタイム中継サーバー (Node.js + Socket.io)
│   ├── src/
│   │   ├── server.ts       # Socket.ioサーバー本体
│   │   ├── roomManager.ts  # ルーム・ゲーム進行管理
│   │   ├── topics.ts       # お題・ワードウルフのテーマデータ
│   │   └── types.ts        # 型定義
│   └── package.json
├── client/                 # フロントエンド & アプリ (React + Vite + Tailwind CSS)
│   ├── src/
│   │   ├── components/     # UIコンポーネント (HomeView, Lobby, Games, Chat, StampOverlay等)
│   │   ├── hooks/          # Socket.io接続フック
│   │   └── App.tsx
│   ├── electron/           # Windowsデスクトップアプリ用 (Electron)
│   ├── dist-electron/      # 生成されたWindows用 .exe ファイル
│   ├── android/            # Android Studioプロジェクト (Capacitor)
│   ├── ios/                # Xcodeプロジェクト (Capacitor)
│   └── package.json
└── README.md
```

---

## 🚀 すぐに遊ぶ手順

### 1. サーバーの起動
```bash
cd server
npm start
# サーバーがポート 3001 (http://localhost:3001) で起動します
```

### 2. Windowsで遊ぶ場合

#### A. 生成済み `.exe` を直接起動する（推奨）
以下のフォルダにビルド済みの実行ファイルがあります：
- **ポータブル版（インストール不要）**:
  `client/dist-electron/雑談ゲーム 1.0.0.exe`
- **インストーラー版**:
  `client/dist-electron/雑談ゲーム Setup 1.0.0.exe`

ダブルクリックするだけで、ネイティブWindowsアプリとして立ち上がります！

#### B. ブラウザまたは開発サーバーで遊ぶ
```bash
cd client
npm run dev
# http://localhost:5173 をブラウザで開きます
```

---

## 📱 モバイルアプリ（Android / iOS）の動かし方

### 1. スマホのブラウザから直接参加（最も手軽）
1. サーバーを動かしているPCと、スマホを同じWi-Fiに接続します。
2. PCのローカルIPアドレスを確認します（例: `192.168.1.5`）。
3. PCのブラウザまたはexe上でアプリ画面右上の **⚙️（設定ボタン）** を押し、サーバーURLを `http://192.168.1.5:3001` に設定します。
4. スマホのブラウザ（ChromeやSafari）から `http://192.168.1.5:5173` にアクセスするだけで、ネイティブアプリ同様にプレイできます！

### 2. Android APK / ネイティブアプリのビルド
プロジェクトにはCapacitor Androidがセットアップ済みです。
```bash
cd client
# Webの更新を同期
npm run cap:sync

# Android Studio で開く
npm run cap:open:android
```
Android Studio が立ち上がったら、`Build > Build Bundle(s) / APK(s) > Build APK(s)` を選択することで、実機にインストール可能な `.apk` ファイルがビルドされます。

### 3. iOSアプリのビルド（Mac環境がある場合）
```bash
cd client
npm run cap:sync
npm run cap:open:ios
```
Xcode が開き、実機iPhoneやシミュレーターへの転送・アーカイブが可能です。

---

## 🛠️ Windows .exe の再ビルド方法
クライアントのUIやお題などを変更した場合、以下のコマンド1行でWindows向け `.exe` を再生成できます：
```bash
cd client
npm run electron:build
```
`client/dist-electron/` 配下に新しい `.exe` ファイルが出力されます。
