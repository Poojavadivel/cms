@echo off
setlocal EnableDelayedExpansion

set "ROOT_DIR=%~dp0"
set "BACKEND_DIR=%ROOT_DIR%backend"

echo =============================================
echo MIT Connect startup script
echo =============================================
echo.

cd /d "%ROOT_DIR%"
if errorlevel 1 (
  echo Failed to switch to root directory.
  exit /b 1
)

echo [1/4] Installing frontend dependencies...
call npm install
if errorlevel 1 (
  echo Frontend dependency installation failed.
  exit /b 1
)

if exist "%BACKEND_DIR%\requirements.txt" (
  echo [2/4] Backend will run with FastAPI Python stack.
  where py >nul 2>nul
  if !errorlevel! EQU 0 (
    echo [3/4] Installing backend Python dependencies...
    cd /d "%BACKEND_DIR%"
    py -m pip install -r requirements.txt
  ) else (
    echo [3/4] Python launcher not found. Skipping Python dependency install.
  )
) else (
  echo [3/4] Skipping backend Python dependency install - requirements.txt not found.
)

echo [4/4] Starting backend and frontend servers...

if exist "%BACKEND_DIR%\main.py" (
  start "MIT Connect Backend (FastAPI)" cmd /k "cd /d ""%ROOT_DIR%"" && py -m uvicorn backend.main:app --reload --host 0.0.0.0 --port 5000"
) else (
  echo backend\main.py not found. FastAPI backend was not started.
)

start "MIT Connect Frontend" cmd /k "cd /d ""%ROOT_DIR%"" && npm run dev"

echo.
echo Both services were started in separate terminal windows.
echo Close those windows to stop the servers.
echo.

endlocal
