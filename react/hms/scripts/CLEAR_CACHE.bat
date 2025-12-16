@echo off
echo Clearing React build cache...

cd /d "%~dp0"

echo.
echo [1/3] Removing .cache folder...
if exist ".cache" (
    rmdir /s /q ".cache"
    echo     ✓ .cache removed
) else (
    echo     - .cache not found
)

echo.
echo [2/3] Removing node_modules\.cache...
if exist "node_modules\.cache" (
    rmdir /s /q "node_modules\.cache"
    echo     ✓ node_modules\.cache removed
) else (
    echo     - node_modules\.cache not found
)

echo.
echo [3/3] Clearing npm cache...
call npm cache clean --force 2>nul
echo     ✓ npm cache cleared

echo.
echo ========================================
echo   Cache cleared successfully!
echo ========================================
echo.
echo Next steps:
echo   1. Close this window
echo   2. Stop your dev server (Ctrl+C if running)
echo   3. Run: npm start
echo.

pause
