@echo off
echo Starting TikViddl Services...

REM Start API in new PowerShell window
start "TikViddl API" powershell -NoExit -Command "cd 'C:\Users\Abid khan afridi\downloads\Git_Cobalt\cobalt\api'; node src/cobalt-tiktok.js"

REM Wait a moment for API to start
timeout /t 3 /nobreak >nul

REM Start Frontend in new PowerShell window  
start "TikViddl Frontend" powershell -NoExit -Command "cd 'C:\Users\Abid khan afridi\downloads\Git_Cobalt\cobalt\web'; npm run dev"

echo Services starting in separate windows...
echo API: http://localhost:9000
echo Frontend: http://localhost:5173
pause
