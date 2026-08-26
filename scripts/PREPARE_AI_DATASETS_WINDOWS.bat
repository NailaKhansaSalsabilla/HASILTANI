@echo off
setlocal
cd /d "%~dp0..\ai"

if not exist .venv py -m venv .venv
call .venv\Scripts\activate

python -m pip install --upgrade pip
if errorlevel 1 goto :error
pip install -r requirements.txt
if errorlevel 1 goto :error

echo.
echo ============================================================
echo  HASILTANI - PREPARE QUALITY DATASET
echo ============================================================
echo Stage dataset 3 kelas sudah dibawa oleh installer:
echo   unripe ^| ripe ^| overripe

echo Spoilage guard akan mengambil subset kecil otomatis dari sumber
echo CC BY 4.0 untuk 4 komoditas:
echo   fresh ^| rotten

echo Tidak perlu download dataset manual.
echo Proses bersifat resume-safe: bila internet putus, jalankan lagi.
echo.

python prepare_datasets.py --spoilage-per-state 300 --workers 8
if errorlevel 1 goto :error

echo.
echo Dataset quality selesai.
echo Lokasi: ai\quality_data
pause
exit /b 0

:error
echo.
echo Prepare gagal. Baca pesan error di atas.
echo Jika download terputus, jalankan file ini lagi; file yang sudah ada tidak diulang.
pause
exit /b 1
