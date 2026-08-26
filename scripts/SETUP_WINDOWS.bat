@echo off
setlocal
cd /d %~dp0\..
echo =============================================
echo HASILTANI - SETUP LOCAL WINDOWS
echo =============================================

echo.
echo [1/3] Frontend dependencies...
cd frontend
call npm install
if errorlevel 1 goto :error
cd ..

echo.
echo [2/3] Backend virtual environment...
cd backend
if not exist .venv py -m venv .venv
call .venv\Scripts\activate
python -m pip install --upgrade pip
pip install -r requirements.txt
if errorlevel 1 goto :error
if not exist .env copy .env.example .env >nul
cd ..

echo.
echo [3/3] Frontend environment...
if not exist frontend\.env.local copy frontend\.env.local.example frontend\.env.local >nul

echo.
echo SETUP SELESAI.
echo Jalankan scripts\START_LOCAL.bat
pause
exit /b 0

:error
echo.
echo Setup gagal. Periksa pesan error di atas.
pause
exit /b 1
