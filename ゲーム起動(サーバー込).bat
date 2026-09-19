@echo off
chcp 65001 > nul
echo ========================================================
echo   雑談ゲーム サーバーとアプリを起動しています...
echo ========================================================

REM サーバーが起動していない場合は別ウィンドウで起動
powershell -Command "if (-not (Get-NetTCPConnection -LocalPort 3010 -ErrorAction SilentlyContinue)) { Start-Process cmd.exe -ArgumentList '/c', 'cd /d \"%~dp0server\" && npm start' -WindowStyle Minimized }"

timeout /t 2 /nobreak > nul

REM アプリ(exe)を起動
if exist "%~dp0release\ChatGame-Portable-1.0.0.exe" (
    start "" "%~dp0release\ChatGame-Portable-1.0.0.exe"
) else if exist "%~dp0client\dist-electron\win-unpacked\雑談ゲーム.exe" (
    start "" "%~dp0client\dist-electron\win-unpacked\雑談ゲーム.exe"
) else (
    echo アプリをブラウザで起動します...
    cd /d "%~dp0client"
    npm run dev
)
