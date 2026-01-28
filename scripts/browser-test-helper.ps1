# 브라우저 자동화 테스트 헬퍼 스크립트
# 사용법: powershell -ExecutionPolicy Bypass -File scripts/browser-test-helper.ps1

param(
    [string]$Action = "check",
    [int]$Port = 5000
)

function Check-ServerStatus {
    param([int]$Port)
    
    Write-Host "🔍 Checking server status on port $Port..." -ForegroundColor Cyan
    
    $portCheck = netstat -ano | findstr ":$Port" | findstr "LISTENING"
    if (-not $portCheck) {
        Write-Host "  ❌ Server is NOT running on port $Port" -ForegroundColor Red
        return $false
    }
    
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:$Port" -TimeoutSec 5 -UseBasicParsing -ErrorAction Stop
        if ($response.StatusCode -eq 200) {
            Write-Host "  ✅ Server is running and responding" -ForegroundColor Green
            return $true
        }
    } catch {
        Write-Host "  ⚠️  Server is running but not responding" -ForegroundColor Yellow
        Write-Host "  📝 Error: $($_.Exception.Message)" -ForegroundColor Yellow
        return $false
    }
    
    return $false
}

function Start-Server {
    param([int]$Port)
    
    Write-Host "🚀 Starting server on port $Port..." -ForegroundColor Cyan
    
    # 기존 서버 프로세스 종료
    $existing = netstat -ano | findstr ":$Port"
    if ($existing) {
        Write-Host "  ⚠️  Found existing server. Stopping..." -ForegroundColor Yellow
        $processes = Get-NetTCPConnection -LocalPort $Port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
        foreach ($pid in $processes) {
            if ($pid) {
                Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
                Write-Host "    ✅ Stopped process $pid" -ForegroundColor Green
            }
        }
        Start-Sleep -Seconds 2
    }
    
    # 서버 시작
    $env:NODE_ENV = "development"
    Start-Process -NoNewWindow -FilePath "npx" -ArgumentList "tsx", "server/index.ts" -PassThru | Out-Null
    
    # 서버가 시작될 때까지 대기
    Write-Host "  ⏳ Waiting for server to start..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    while ($waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        if (Check-ServerStatus -Port $Port) {
            Write-Host "  ✅ Server started successfully" -ForegroundColor Green
            return $true
        }
    }
    
    Write-Host "  ❌ Server failed to start within $maxWait seconds" -ForegroundColor Red
    return $false
}

switch ($Action) {
    "check" {
        $status = Check-ServerStatus -Port $Port
        exit $(if ($status) { 0 } else { 1 })
    }
    "start" {
        $started = Start-Server -Port $Port
        exit $(if ($started) { 0 } else { 1 })
    }
    "restart" {
        $started = Start-Server -Port $Port
        exit $(if ($started) { 0 } else { 1 })
    }
    default {
        Write-Host "Unknown action: $Action" -ForegroundColor Red
        Write-Host "Usage: .\browser-test-helper.ps1 -Action [check|start|restart] -Port [port]" -ForegroundColor Yellow
        exit 1
    }
}



