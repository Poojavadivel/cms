@echo off
echo ========================================
echo  RESTARTING HOSPITAL MANAGEMENT SERVER
echo ========================================
echo.

cd Server

echo [1/3] Stopping any running Node processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo.
echo [2/3] Starting server...
echo.
start cmd /k "node server.js"

echo.
echo [3/3] Done!
echo.
echo Server is starting in a new window...
echo Check that window for server logs.
echo.
echo ========================================
echo  Server should be running now!
echo ========================================
pause
