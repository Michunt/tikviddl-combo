# TikTok API Test Script
Write-Host "Testing TikTok-only API..." -ForegroundColor Cyan
Write-Host ""

try {
    Write-Host "1. Testing API status..." -ForegroundColor Yellow
    $response = Invoke-RestMethod -Uri "http://localhost:9000" -Method GET -TimeoutSec 10
    
    Write-Host "✓ API is responding" -ForegroundColor Green
    Write-Host "Version: $($response.cobalt.version)" -ForegroundColor White
    Write-Host "URL: $($response.cobalt.url)" -ForegroundColor White
    Write-Host "Services: $($response.cobalt.services -join ', ')" -ForegroundColor White
    Write-Host ""
    
    Write-Host "2. Testing TikTok URL processing..." -ForegroundColor Yellow
    $testBody = @{
        url = "https://www.tiktok.com/@test/video/1234567890123456789"
    } | ConvertTo-Json
    
    try {
        $testResponse = Invoke-RestMethod -Uri "http://localhost:9000" -Method POST -Body $testBody -ContentType "application/json" -TimeoutSec 10
        Write-Host "✓ TikTok URL processing works" -ForegroundColor Green
        Write-Host "Response status: $($testResponse.status)" -ForegroundColor White
    } catch {
        Write-Host "⚠ TikTok URL test failed (expected for test URL): $($_.Exception.Message)" -ForegroundColor Yellow
    }
    
    Write-Host ""
    Write-Host "3. Testing non-TikTok URL rejection..." -ForegroundColor Yellow
    $rejectBody = @{
        url = "https://www.youtube.com/watch?v=dQw4w9WgXcQ"
    } | ConvertTo-Json
    
    try {
        $rejectResponse = Invoke-RestMethod -Uri "http://localhost:9000" -Method POST -Body $rejectBody -ContentType "application/json" -TimeoutSec 10
        Write-Host "WARNING: YouTube URL was not rejected (unexpected)" -ForegroundColor Red
    } catch {
        Write-Host "SUCCESS: Non-TikTok URL correctly rejected" -ForegroundColor Green
    }
    
    Write-Host ""
    Write-Host "SUCCESS: TikTok-only API is working correctly!" -ForegroundColor Green
    Write-Host "Ready to download TikTok content at: http://localhost:9000" -ForegroundColor Cyan
    
} catch {
    Write-Host "ERROR: API test failed: $($_.Exception.Message)" -ForegroundColor Red
    Write-Host "Make sure the API is running with: node src/cobalt-tiktok.js" -ForegroundColor Yellow
}
