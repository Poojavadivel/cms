@echo off
echo ========================================
echo RESTARTING REACT WITH LOCALHOST CONFIG
echo ========================================
echo.

cd react\hms

echo [1/3] Stopping any existing React processes...
taskkill /F /IM node.exe 2>nul
timeout /t 2 /nobreak >nul

echo [2/3] Clearing React cache...
if exist node_modules\.cache rmdir /s /q node_modules\.cache
if exist .env.local del .env.local

echo [3/3] Starting React with fresh .env...
echo.
echo ✅ IMPORTANT: React will now use http://localhost:3000/api
echo.
echo After React starts:
echo   1. Open http://localhost:3000 in browser
echo   2. Go to Payroll page
echo   3. Check console shows: http://localhost:3000/api/payroll
echo.
echo Press Ctrl+C to stop the server when done
echo ========================================
echo.

npm start
