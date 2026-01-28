# Windows 호환 서버 시작 스크립트
# 사용법: powershell -ExecutionPolicy Bypass -File scripts/dev-server.ps1

$env:NODE_ENV = "development"
$port = 5000

Write-Host "🚀 Starting Development Server..." -ForegroundColor Cyan

# 기존 서버 프로세스 종료
Write-Host "`n[1/3] Checking for existing server on port $port..." -ForegroundColor Yellow
$existing = netstat -ano | findstr ":$port"
if ($existing) {
    Write-Host "  ⚠️  Found existing server. Stopping..." -ForegroundColor Yellow
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) {
        if ($pid) {
            Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
            Write-Host "    ✅ Stopped process $pid" -ForegroundColor Green
        }
    }
    Start-Sleep -Seconds 2
} else {
    Write-Host "  ✅ No existing server found" -ForegroundColor Green
}

# 서버 시작
Write-Host "`n[2/3] Starting server on port $port..." -ForegroundColor Yellow
Write-Host "  📝 Server will be available at http://localhost:$port" -ForegroundColor Cyan
Write-Host "  ⚠️  Press Ctrl+C to stop the server`n" -ForegroundColor Yellow

# 서버 실행
npx tsx server/index.ts



