@echo off
color 0A
title HMS React - Starting Fixed Application

echo.
echo ========================================================================
echo     HOSPITAL MANAGEMENT SYSTEM - REACT FRONTEND
echo     API Configuration Fixed - Ready to Start
echo ========================================================================
echo.
echo [INFO] All API endpoints have been fixed to use correct URLs
echo [INFO] Authentication headers updated to match backend
echo [INFO] Base URL: https://hms-dev.onrender.com/api
echo.
echo ========================================================================
echo     PRE-START CHECKLIST
echo ========================================================================
echo.

:CHECK_ENV
echo [1/4] Checking .env configuration...
if not exist .env (
    echo [ERROR] .env file not found!
    echo [ACTION] Please create .env file with REACT_APP_API_URL
    pause
    exit /b 1
)
findstr /C:"REACT_APP_API_URL" .env >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo [ERROR] REACT_APP_API_URL not found in .env
    pause
    exit /b 1
)
echo [OK] .env file configured correctly
echo.

:CHECK_NODE_MODULES
echo [2/4] Checking node_modules...
if not exist node_modules (
    echo [WARNING] node_modules not found
    echo [ACTION] Installing dependencies...
    call npm install
    if %ERRORLEVEL% NEQ 0 (
        echo [ERROR] Failed to install dependencies
        pause
        exit /b 1
    )
) else (
    echo [OK] node_modules exists
)
echo.

:CLEAR_CACHE
echo [3/4] Clearing React cache...
if exist node_modules\.cache (
    rmdir /s /q node_modules\.cache >nul 2>&1
    echo [OK] React cache cleared
) else (
    echo [OK] No cache to clear
)
echo.

:START_SERVER
echo [4/4] Starting development server...
echo.
echo ========================================================================
echo     IMPORTANT INSTRUCTIONS
echo ========================================================================
echo.
echo 1. After server starts, open: http://localhost:3000
echo 2. Press F12 to open Developer Tools
echo 3. Go to Application tab -^> Local Storage -^> Clear all
echo 4. Go to Network tab to monitor API calls
echo 5. Try logging in with: banu@karurgastro.com
echo.
echo Expected login request:
echo   POST https://hms-dev.onrender.com/api/auth/login
echo   Header: x-auth-token
echo.
echo If you see 404 errors, press Ctrl+C and run VERIFY_API_CONFIG.bat
echo.
echo ========================================================================
echo.
echo [STARTING] React Development Server...
echo.

npm start

:ERROR
echo.
echo ========================================================================
echo [ERROR] Server failed to start
echo ========================================================================
echo.
echo Possible solutions:
echo 1. Check if port 3000 is already in use
echo 2. Run: npm install
echo 3. Run: npm cache clean --force
echo 4. Delete node_modules and package-lock.json, then npm install
echo.
pause
