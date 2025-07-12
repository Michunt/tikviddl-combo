# TikViddl Web Startup Script
Write-Host "=================================" -ForegroundColor Magenta
Write-Host "       TikViddl Web Frontend       " -ForegroundColor Magenta
Write-Host "=================================" -ForegroundColor Magenta
Write-Host ""
Write-Host "Starting TikViddl web frontend on port 5173..." -ForegroundColor Yellow
Write-Host "Web interface will be available at: http://localhost:5173" -ForegroundColor Green
Write-Host ""
Write-Host "Make sure the API is running on port 9000!" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Gray
Write-Host ""

# Copy environment file and start the web server
Set-Location "web"

# Ensure proper environment configuration
Write-Host "Setting up environment variables..." -ForegroundColor Yellow
$env:WEB_DEFAULT_API = "http://localhost:9000/"
$env:WEB_HOST = "localhost:5173"

# Create/update .env.local file
@"
WEB_DEFAULT_API=http://localhost:9000/
WEB_HOST=localhost:5173
"@ | Out-File -FilePath ".env.local" -Encoding UTF8

Write-Host "Environment configured. Starting development server..." -ForegroundColor Green
pnpm run dev
