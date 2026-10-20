@echo off
title Kuis IPS Live TikTok - Server
echo =======================================================
echo   MEMULAI SERVER KUIS IPS TIKTOK LIVE (PORT 3050)...
echo =======================================================
echo.
echo Membuka browser:
echo - Dashboard Admin & Simulator: http://localhost:3050/admin.html
echo - Overlay Stream (OBS Studio): http://localhost:3050/overlay.html
echo.
start http://localhost:3050
node server.js
pause
