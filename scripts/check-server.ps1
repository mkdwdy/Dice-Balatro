# 서버 상태 확인 스크립트
# 사용법: powershell -ExecutionPolicy Bypass -File scripts/check-server.ps1

$port = 5000
$url = "http://localhost:$port"

Write-Host "🔍 Checking Server Status..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 포트 확인
Write-Host "`n[1/2] Checking port $port..." -ForegroundColor Yellow
$portCheck = netstat -ano | findstr ":$port"
if (-not $portCheck) {
    Write-Host "  ❌ Server is NOT running on port $port" -ForegroundColor Red
    Write-Host "`n💡 Solution: Run 'npm run dev:win' to start the server" -ForegroundColor Yellow
    exit 1
} else {
    Write-Host "  ✅ Port $port is in use" -ForegroundColor Green
}

# HTTP 응답 확인
Write-Host "`n[2/2] Checking HTTP response..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        Write-Host "  ✅ Server is running and responding" -ForegroundColor Green
        Write-Host "  📝 Status Code: $($response.StatusCode)" -ForegroundColor Cyan
        Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
        Write-Host "✅ Server is ready for testing!" -ForegroundColor Green
        Write-Host "🌐 Open http://localhost:$port in your browser" -ForegroundColor Cyan
        exit 0
    } else {
        Write-Host "  ⚠️  Server responded with status code: $($response.StatusCode)" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host "  ❌ Server is running but not responding" -ForegroundColor Red
    Write-Host "  📝 Error: $($_.Exception.Message)" -ForegroundColor Yellow
    Write-Host "`n💡 Solution: Check server logs for errors" -ForegroundColor Yellow
    exit 1
}



