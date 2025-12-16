@echo off
echo ========================================
echo VERIFYING REACT API CONFIGURATION
echo ========================================
echo.

echo [1/5] Checking .env file...
findstr "REACT_APP_API_URL" .env
echo.

echo [2/5] Checking for hardcoded URLs in services...
findstr /S /N "localhost:5000" src\services\*.js 2>nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Found localhost:5000 references
) else (
    echo ✓ No localhost:5000 found
)
echo.

echo [3/5] Checking authentication headers...
findstr /S /N "Authorization.*Bearer" src\services\*.js 2>nul
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Found Bearer token usage - should use x-auth-token
) else (
    echo ✓ All services use x-auth-token
)
echo.

echo [4/5] Checking for missing baseURL in axios instances...
powershell -Command "Get-Content src\services\*.js | Select-String -Pattern 'axios.create\(\s*\{' -Context 0,3 | Select-String -NotMatch 'baseURL' -Quiet"
if %ERRORLEVEL% EQU 0 (
    echo WARNING: Some axios instances might be missing baseURL
) else (
    echo ✓ All axios instances have baseURL configured
)
echo.

echo [5/5] Verifying API endpoints...
echo Base URL from .env:
type .env | findstr "REACT_APP_API_URL"
echo.
echo Expected endpoints:
echo   - Login: https://hms-dev.onrender.com/api/auth/login
echo   - Patients: https://hms-dev.onrender.com/api/patients
echo   - Appointments: https://hms-dev.onrender.com/api/appointments
echo.

echo ========================================
echo NEXT STEPS:
echo ========================================
echo 1. Start/Restart React dev server: npm start
echo 2. Clear browser cache and localStorage
echo 3. Try logging in
echo 4. Check browser console for errors
echo.
echo Full details: ..\API_FIX_SUMMARY.txt
echo ========================================
pause
