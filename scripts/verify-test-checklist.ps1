# 테스트 체크리스트 자동 검증 스크립트
# 사용법: powershell -ExecutionPolicy Bypass -File scripts/verify-test-checklist.ps1

$checklist = @{
    "ServerRunning" = $false
    "BrowserAccessible" = $false
    "PortAvailable" = $false
}

Write-Host "🔍 Verifying Test Checklist..." -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

# 1. 서버 실행 확인
Write-Host "`n[1/3] Checking if server is running..." -ForegroundColor Yellow
$port = 5000
$portCheck = netstat -ano | findstr ":$port"
if ($portCheck) {
    $checklist["PortAvailable"] = $true
    Write-Host "  ✅ Port $port is in use (server likely running)" -ForegroundColor Green
} else {
    Write-Host "  ❌ Port $port is NOT in use" -ForegroundColor Red
    Write-Host "    💡 Run 'npm run dev:win' to start the server" -ForegroundColor Yellow
}

# 2. 브라우저 접근 확인
Write-Host "`n[2/3] Checking if browser can access server..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://localhost:$port" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
    if ($response.StatusCode -eq 200) {
        $checklist["BrowserAccessible"] = $true
        $checklist["ServerRunning"] = $true
        Write-Host "  ✅ Browser can access server" -ForegroundColor Green
        Write-Host "    📝 Status Code: $($response.StatusCode)" -ForegroundColor Cyan
    } else {
        Write-Host "  ⚠️  Server responded with status code: $($response.StatusCode)" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ❌ Browser cannot access server" -ForegroundColor Red
    Write-Host "    📝 Error: $($_.Exception.Message)" -ForegroundColor Yellow
    if (-not $checklist["PortAvailable"]) {
        Write-Host "    💡 Server is not running. Start it with 'npm run dev:win'" -ForegroundColor Yellow
    } else {
        Write-Host "    💡 Server may be starting up. Wait a few seconds and try again." -ForegroundColor Yellow
    }
}

# 결과 요약
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "📊 Test Checklist Summary:" -ForegroundColor Cyan
Write-Host "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

$allPassed = $true
foreach ($item in $checklist.GetEnumerator() | Sort-Object Name) {
    $status = if ($item.Value) { "✅" } else { "❌" }
    $color = if ($item.Value) { "Green" } else { "Red" }
    Write-Host "  $status $($item.Key)" -ForegroundColor $color
    if (-not $item.Value) { $allPassed = $false }
}

Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan

if ($allPassed) {
    Write-Host "✅ All automated checks passed!" -ForegroundColor Green
    Write-Host "`n⚠️  Manual testing still required:" -ForegroundColor Yellow
    Write-Host "  [ ] Game starts successfully" -ForegroundColor Yellow
    Write-Host "  [ ] TEST panel opens" -ForegroundColor Yellow
    Write-Host "  [ ] Test scenarios work correctly" -ForegroundColor Yellow
    Write-Host "  [ ] No console errors (F12)" -ForegroundColor Yellow
    Write-Host "  [ ] No server errors in logs" -ForegroundColor Yellow
    exit 0
} else {
    Write-Host "❌ Some checks failed. Please fix before testing." -ForegroundColor Red
    Write-Host "`n💡 Quick fixes:" -ForegroundColor Yellow
    Write-Host "  1. Start server: npm run dev:win" -ForegroundColor Yellow
    Write-Host "  2. Check server: npm run dev:check" -ForegroundColor Yellow
    exit 1
}



