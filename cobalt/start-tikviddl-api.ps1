# TikViddl API Startup Script
Write-Host "=================================" -ForegroundColor Cyan
Write-Host "       TikViddl API Server        " -ForegroundColor Cyan
Write-Host "=================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Starting TikViddl API on port 9000..." -ForegroundColor Yellow
Write-Host "API will be available at: http://localhost:9000" -ForegroundColor Green
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Change to API directory and start the server
Set-Location "api"
node src/cobalt-tiktok.js
