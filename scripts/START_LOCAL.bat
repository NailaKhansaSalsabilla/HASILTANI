@echo off
setlocal
cd /d %~dp0\..
if not exist frontend\node_modules (
  echo Dependency frontend belum terpasang. Jalankan scripts\SETUP_WINDOWS.bat dulu.
  pause
  exit /b 1
)
if not exist backend\.venv (
  echo Virtual environment backend belum ada. Jalankan scripts\SETUP_WINDOWS.bat dulu.
  pause
  exit /b 1
)
start "HASILTANI API" cmd /k "cd /d %cd%\backend && call .venv\Scripts\activate && python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload"
start "HASILTANI WEB" cmd /k "cd /d %cd%\frontend && npm run dev"
timeout /t 3 >nul
start http://localhost:3000
