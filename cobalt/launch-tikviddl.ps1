# TikViddl Complete Launcher
Write-Host "" 
Write-Host "████████╗██╗██╗  ██╗██╗   ██╗██╗██████╗ ██████╗ ██╗     " -ForegroundColor Cyan
Write-Host "╚══██╔══╝██║██║ ██╔╝██║   ██║██║██╔══██╗██╔══██╗██║     " -ForegroundColor Cyan
Write-Host "   ██║   ██║█████╔╝ ██║   ██║██║██║  ██║██║  ██║██║     " -ForegroundColor Cyan
Write-Host "   ██║   ██║██╔═██╗ ╚██╗ ██╔╝██║██║  ██║██║  ██║██║     " -ForegroundColor Cyan
Write-Host "   ██║   ██║██║  ██╗ ╚████╔╝ ██║██████╔╝██████╔╝███████╗" -ForegroundColor Cyan
Write-Host "   ╚═╝   ╚═╝╚═╝  ╚═╝  ╚═══╝  ╚═╝╚═════╝ ╚═════╝ ╚══════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "                 TikTok Video Downloader                    " -ForegroundColor Yellow
Write-Host "" 
Write-Host "================================================================" -ForegroundColor Gray
Write-Host ""

Write-Host "🚀 Starting TikViddl API Server..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Abid khan afridi\downloads\Git_Cobalt\cobalt'; .\start-tikviddl-api.ps1"

Write-Host "⏳ Waiting for API to initialize..." -ForegroundColor Yellow
Start-Sleep 5

# Test API
try {
    $apiResponse = Invoke-RestMethod -Uri "http://localhost:9000" -Method GET -TimeoutSec 10
    Write-Host "✅ API Server Running" -ForegroundColor Green
    Write-Host "   📍 API URL: http://localhost:9000" -ForegroundColor White
    Write-Host "   📦 Version: $($apiResponse.cobalt.version)" -ForegroundColor White
    Write-Host "   🎯 Services: $($apiResponse.cobalt.services)" -ForegroundColor White
    Write-Host ""
} catch {
    Write-Host "❌ API failed to start: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Please check the API window for errors." -ForegroundColor Yellow
    exit 1
}

Write-Host "🌐 Starting TikViddl Web Frontend..." -ForegroundColor Green
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'C:\Users\Abid khan afridi\downloads\Git_Cobalt\cobalt'; .\start-tikviddl-web.ps1"

Write-Host "⏳ Waiting for web frontend to initialize..." -ForegroundColor Yellow
Start-Sleep 20

# Test Web Frontend
try {
    $webResponse = Invoke-WebRequest -Uri "http://localhost:5173" -Method GET -TimeoutSec 10
    Write-Host "✅ Web Frontend Running" -ForegroundColor Green
    Write-Host "   📍 Web URL: http://localhost:5173" -ForegroundColor White
    Write-Host "   📊 Status: $($webResponse.StatusCode) $($webResponse.StatusDescription)" -ForegroundColor White
} catch {
    Write-Host "⚠️  Web frontend may still be starting: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "Please wait a few more seconds and try http://localhost:5173" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "================================================================" -ForegroundColor Gray
Write-Host "🎉 TikViddl is ready!" -ForegroundColor Green
Write-Host ""
Write-Host "📱 API Backend:   http://localhost:9000" -ForegroundColor Cyan
Write-Host "🌐 Web Frontend:  http://localhost:5173" -ForegroundColor Magenta
Write-Host ""
Write-Host "✨ Features:" -ForegroundColor Yellow
Write-Host "   • Download TikTok videos (with/without watermark)" -ForegroundColor White
Write-Host "   • Extract audio from TikTok videos" -ForegroundColor White
Write-Host "   • Download TikTok photo slideshows" -ForegroundColor White
Write-Host "   • Multiple quality options" -ForegroundColor White
Write-Host "   • Professional API with rate limiting" -ForegroundColor White
Write-Host ""
Write-Host "🔧 Usage:" -ForegroundColor Yellow
Write-Host "   1. Open your browser to http://localhost:5173" -ForegroundColor White
Write-Host "   2. Paste any TikTok URL" -ForegroundColor White
Write-Host "   3. Click download and enjoy!" -ForegroundColor White
Write-Host ""
Write-Host "TikViddl setup complete!" -ForegroundColor Gray
