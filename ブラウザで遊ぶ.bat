@echo off
chcp 65001 > nul
echo ========================================================
echo   雑談ゲーム（ブラウザ版）を起動しています...
echo ========================================================

REM サーバーが起動していない場合はバックグラウンドで起動
powershell -Command "if (-not (Get-NetTCPConnection -LocalPort 3010 -ErrorAction SilentlyContinue)) { Start-Process cmd.exe -ArgumentList '/c', 'cd /d \"%~dp0server\" && npm start' -WindowStyle Minimized }"

timeout /t 2 /nobreak > nul

REM クライアント開発サーバーをバックグラウンド起動し、ブラウザを開く
echo ブラウザでゲームを開きます...
start http://localhost:5173

cd /d "%~dp0client"
npm run dev
