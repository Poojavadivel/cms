@echo off
echo ========================================
echo CLEANING AND REBUILDING FLUTTER APP
echo ========================================
echo.
echo Step 1: Stopping any running Flutter processes...
taskkill /F /IM dart.exe 2>nul
taskkill /F /IM flutter.exe 2>nul
echo.
echo Step 2: Cleaning build cache...
flutter clean
echo.
echo Step 3: Getting dependencies...
flutter pub get
echo.
echo Step 4: Running app...
echo.
flutter run -d chrome --web-renderer html
