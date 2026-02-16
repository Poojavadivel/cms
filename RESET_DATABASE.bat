@echo off
echo ========================================
echo DATABASE RESET SCRIPT
echo ========================================
echo.
echo WARNING: This will DELETE ALL DATA!
echo Only these users will remain:
echo.
echo - Admin: banu@karurgastro.com
echo - Doctor 1: dr.sanjit@karurgastro.com
echo - Doctor 2: dr.sriram@karurgastro.com
echo - Pharmacist: pharmacist@hms.com
echo - Pathologist: pathologist@hms.com
echo.
echo ========================================
echo.
pause

cd /d "%~dp0Server"
node reset_database_keep_users.js

echo.
echo ========================================
echo Script completed!
echo ========================================
pause
