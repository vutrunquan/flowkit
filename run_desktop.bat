@echo off
title Flow Kit Desktop Launcher
color 0b

echo ========================================================
echo               FLOW KIT DESKTOP LAUNCHER
echo ========================================================
echo.

cd /d "%~dp0"

:: 1. Check if dashboard/dist exists
if not exist "dashboard\dist\index.html" (
    echo [1/3] Dashboard dist chua ton tai, dang tien hanh build...
    cd dashboard
    call npm run build
    cd ..
) else (
    echo [1/3] Dashboard dist da san sang!
)

:: 2. Check if desktop/node_modules exists
if not exist "desktop\node_modules" (
    echo [2/3] Cai dat thu vien Electron...
    cd desktop
    call npm install
    cd ..
) else (
    echo [2/3] Electron runtime da san sang!
)

:: 3. Launch Electron Desktop App
echo [3/3] Dang khoi chay Flow Kit Desktop...
cd desktop
call npm start

pause
