@echo off
setlocal
cd /d "%~dp0..\ai"

if not exist .venv (
  echo Jalankan PREPARE_AI_DATASETS_WINDOWS.bat terlebih dahulu.
  pause
  exit /b 1
)
call .venv\Scripts\activate

if "%~1"=="" (
  echo.
  echo HASILTANI REAL-PHONE EVALUATION
  echo.
  echo Gunakan salah satu:
  echo   scripts\EVALUATE_REAL_PHOTOS_WINDOWS.bat pisang
  echo   scripts\EVALUATE_REAL_PHOTOS_WINDOWS.bat mangga
  echo   scripts\EVALUATE_REAL_PHOTOS_WINDOWS.bat jeruk
  echo   scripts\EVALUATE_REAL_PHOTOS_WINDOWS.bat tomat
  echo.
  echo Struktur foto:
  echo   ai\external_real\pisang\unripe
  echo   ai\external_real\pisang\ripe
  echo   ai\external_real\pisang\overripe
  echo   ai\external_real\pisang\rotten
  echo.
  pause
  exit /b 0
)

python evaluate_real_photos.py %~1
pause
