@echo off
setlocal
cd /d "%~dp0..\ai"

if not exist .venv (
  echo Jalankan PREPARE_AI_DATASETS_WINDOWS.bat terlebih dahulu.
  pause
  exit /b 1
)
call .venv\Scripts\activate

if not exist quality_data\spoilage\train\fresh (
  echo Dataset spoilage belum tersedia.
  echo Jalankan PREPARE_AI_DATASETS_WINDOWS.bat terlebih dahulu.
  pause
  exit /b 1
)

echo.
echo ============================================================
echo  HASILTANI - TRAIN HIERARCHICAL QUALITY MODELS
echo ============================================================
echo Model yang dilatih:
echo   1. Shared spoilage guard  : fresh / rotten
echo   2. Pisang stage model     : unripe / ripe / overripe
echo   3. Mangga stage model     : unripe / ripe / overripe
echo   4. Jeruk stage model      : unripe / ripe / overripe
echo   5. Tomat stage model      : unripe / ripe / overripe
echo.
echo Hasil akhir website tetap 4 kondisi:
echo   Belum Matang ^| Matang ^| Terlalu Matang ^| Rusak/Busuk Berat
echo.

python train.py spoilage --epochs 12 --batch-size 16
if errorlevel 1 goto :error
python train.py stage pisang --epochs 12 --batch-size 16
if errorlevel 1 goto :error
python train.py stage mangga --epochs 12 --batch-size 16
if errorlevel 1 goto :error
python train.py stage jeruk --epochs 12 --batch-size 16
if errorlevel 1 goto :error
python train.py stage tomat --epochs 12 --batch-size 16
if errorlevel 1 goto :error

echo.
echo ============================================================
echo  SEMUA TRAINING SELESAI
echo ============================================================
echo Model aktif ada di backend\models:
echo   spoilage.pt/json
echo   pisang_stage.pt/json
echo   mangga_stage.pt/json
echo   jeruk_stage.pt/json
echo   tomat_stage.pt/json
echo.
echo Model lama tidak dipakai oleh inference Q1.
pause
exit /b 0

:error
echo.
echo Training berhenti karena error. Model yang sudah selesai tetap tersimpan.
pause
exit /b 1
