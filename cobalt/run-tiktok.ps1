# TikTok-only Downloader Setup Script
# This script sets up and runs the TikTok-only version of Cobalt

Write-Host "=== TikTok-only Downloader Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info *> $null
    Write-Host "✓ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "✗ Docker is not running. Please start Docker Desktop and try again." -ForegroundColor Red
    Write-Host "You can start Docker Desktop from the Start menu or by running:" -ForegroundColor Yellow
    Write-Host "  Start-Process 'C:\Program Files\Docker\Docker\Docker Desktop.exe'" -ForegroundColor Yellow
    exit 1
}

Write-Host ""
Write-Host "Building TikTok-only downloader..." -ForegroundColor Blue

# Build the Docker image
try {
    docker build -f Dockerfile.tiktok -t tiktok-downloader .
    Write-Host "✓ Docker image built successfully" -ForegroundColor Green
} catch {
    Write-Host "✗ Failed to build Docker image" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "Starting TikTok-only downloader API..." -ForegroundColor Blue

# Run the container
try {
    docker run -d --name tiktok-api -p 9000:9000 --env-file .env.tiktok tiktok-downloader
    Write-Host "✓ TikTok downloader started successfully" -ForegroundColor Green
    Write-Host ""
    Write-Host "🚀 TikTok downloader is now running at: http://localhost:9000" -ForegroundColor Green
    Write-Host ""
    Write-Host "To test the API, try:" -ForegroundColor Yellow
    Write-Host "  curl http://localhost:9000" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To stop the service, run:" -ForegroundColor Yellow
    Write-Host "  docker stop tiktok-api" -ForegroundColor Gray
    Write-Host "  docker rm tiktok-api" -ForegroundColor Gray
    Write-Host ""
    Write-Host "To view logs:" -ForegroundColor Yellow
    Write-Host "  docker logs tiktok-api" -ForegroundColor Gray
} catch {
    Write-Host "✗ Failed to start container" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "=== Setup Complete ===" -ForegroundColor Cyan
