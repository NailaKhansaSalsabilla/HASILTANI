@echo off
setlocal
cd /d %~dp0\..
echo Supabase lokal membutuhkan Docker Desktop yang sedang berjalan.
npx supabase start
if errorlevel 1 (
  echo Supabase gagal start. Pastikan Docker Desktop dan Supabase CLI tersedia.
  pause
  exit /b 1
)
npx supabase status
pause
