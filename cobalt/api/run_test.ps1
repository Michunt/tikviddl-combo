# PowerShell script to start Cobalt server and run tests

Write-Host "🚀 Starting Cobalt API Server..." -ForegroundColor Green

# Start the server in a background job
$job = Start-Job -ScriptBlock {
    Set-Location "C:\Users\`"Abid khan afridi`"\downloads\git_Cobalt\cobalt\api"
    pnpm start
}

Write-Host "⏳ Waiting for server to initialize..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

Write-Host "🧪 Running API tests..." -ForegroundColor Cyan
node test_cobalt.js

Write-Host "`nTest completed!" -ForegroundColor Green
Write-Host "Cobalt supports the following services:" -ForegroundColor Blue
Write-Host "   - YouTube (videos, music, shorts)" -ForegroundColor White
Write-Host "   - TikTok (videos, images, audio)" -ForegroundColor White  
Write-Host "   - Instagram (reels, photos, videos)" -ForegroundColor White
Write-Host "   - Twitter/X (videos, images)" -ForegroundColor White
Write-Host "   - Facebook (public videos)" -ForegroundColor White
Write-Host "   - SoundCloud (audio)" -ForegroundColor White
Write-Host "   - Vimeo, Reddit, Pinterest, and more!" -ForegroundColor White

Write-Host "`nStopping server..." -ForegroundColor Red
Stop-Job $job
Remove-Job $job
