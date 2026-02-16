@echo off
echo.
echo ========================================
echo   PAYROLL SYSTEM - Quick Start
echo ========================================
echo.
echo This script will start both:
echo   1. Backend Server (Node.js)
echo   2. Flutter App (Chrome)
echo.
pause

echo.
echo Starting Backend Server...
start "Backend Server" cmd /k "cd Server && npm start"

timeout /t 5 /nobreak

echo.
echo Starting Flutter App...
start "Flutter App" cmd /k "flutter run -d chrome"

echo.
echo ========================================
echo Both servers are starting...
echo.
echo Backend: http://localhost:3000
echo Frontend: Will open in Chrome
echo.
echo Check the other windows for status
echo ========================================
echo.
pause
