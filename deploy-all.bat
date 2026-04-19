@echo off
echo ============================================================
echo  SIVILIZE HUB PRO - Deploy ke Vercel
echo ============================================================
echo.

echo [1/3] Build frontend...
call npm run build
if %errorlevel% neq 0 (
    echo ERROR: Frontend build gagal!
    pause
    exit /b 1
)
echo OK: Frontend build berhasil

echo.
echo [2/3] Deploy BACKEND ke Vercel...
cd server
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo ERROR: Backend deploy gagal!
    cd ..
    pause
    exit /b 1
)
cd ..
echo OK: Backend deployed

echo.
echo [3/3] Deploy FRONTEND ke Vercel...
call npx vercel --prod --yes
if %errorlevel% neq 0 (
    echo ERROR: Frontend deploy gagal!
    pause
    exit /b 1
)
echo OK: Frontend deployed

echo.
echo ============================================================
echo  DEPLOY SELESAI!
echo  Frontend: https://sivilize-hub-pro.vercel.app
echo  Backend:  https://server-1rimpvmey-muhamadadrian210-2602s-projects.vercel.app
echo ============================================================
echo.
echo PENTING: Pastikan Deployment Protection sudah dimatikan di
echo Vercel Dashboard untuk project "server"!
echo.
pause
