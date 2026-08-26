@echo off
setlocal
cd /d %~dp0
if not exist .venv (
  echo [HASILTANI] Virtual environment belum ada. Jalankan scripts\SETUP_WINDOWS.bat dari folder root.
  pause
  exit /b 1
)
call .venv\Scripts\activate
python -m uvicorn app.main:app --host 127.0.0.1 --port 8000 --reload
