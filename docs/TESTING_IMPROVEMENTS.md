# 테스트 과정 개선 방안

> ⚠️ **목적**: 테스트 과정이 막히거나 생략되지 않도록 모든 개선 방안을 제시합니다.

## 📋 현재 문제점 분석

### 1. 서버 시작 문제
- **문제**: Windows 환경에서 `NODE_ENV=development` 형식이 작동하지 않음
- **영향**: 서버 시작 실패로 테스트 불가
- **발생 빈도**: 서버 코드 수정 시마다 발생

### 2. 브라우저 자동화 제한
- **문제**: 브라우저 자동화 도구의 타임아웃 및 요소 찾기 실패
- **영향**: 테스트 자동화가 불완전함
- **발생 빈도**: 복잡한 UI 상호작용 시 발생

### 3. 테스트 패널 닫힘
- **문제**: 페이지 새로고침 시 테스트 패널이 닫힘
- **영향**: 테스트 재개 어려움
- **발생 빈도**: 페이지 새로고침 시마다 발생

### 4. 서버 재시작 인지 부족
- **문제**: 서버 코드 수정 후 재시작 필요성을 놓침
- **영향**: 변경사항이 적용되지 않아 테스트 실패
- **발생 빈도**: 서버 코드 수정 시마다 발생 가능

## 🚀 개선 방안

### 1. 서버 시작 자동화 및 모니터링

#### 1.1 Windows 호환 서버 시작 스크립트

**파일**: `scripts/dev-server.ps1` (PowerShell) 또는 `scripts/dev-server.bat` (배치)

```powershell
# scripts/dev-server.ps1
$env:NODE_ENV = "development"
$port = 5000

# 기존 서버 프로세스 종료
Write-Host "Checking for existing server on port $port..."
$existing = netstat -ano | findstr ":$port"
if ($existing) {
    Write-Host "Stopping existing server..."
    $processes = Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -Unique
    foreach ($pid in $processes) {
        Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    }
    Start-Sleep -Seconds 2
}

# 서버 시작
Write-Host "Starting server on port $port..."
npx tsx server/index.ts
```

**사용법**:
```bash
# PowerShell에서
.\scripts\dev-server.ps1

# 또는 package.json에 추가
"dev:win": "powershell -ExecutionPolicy Bypass -File scripts/dev-server.ps1"
```

#### 1.2 서버 상태 모니터링 스크립트

**파일**: `scripts/check-server.ps1`

```powershell
# scripts/check-server.ps1
$port = 5000
$url = "http://localhost:$port"

Write-Host "Checking server status..."

# 포트 확인
$portCheck = netstat -ano | findstr ":$port"
if (-not $portCheck) {
    Write-Host "❌ Server is NOT running on port $port" -ForegroundColor Red
    exit 1
}

# HTTP 응답 확인
try {
    $response = Invoke-WebRequest -Uri $url -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server is running and responding" -ForegroundColor Green
        exit 0
    }
} catch {
    Write-Host "❌ Server is running but not responding" -ForegroundColor Red
    exit 1
}
```

#### 1.3 자동 재시작 감지

**파일**: `scripts/watch-server.ps1`

```powershell
# scripts/watch-server.ps1
# 서버 파일 변경 감지 및 자동 재시작
$watcher = New-Object System.IO.FileSystemWatcher
$watcher.Path = "server"
$watcher.Filter = "*.ts"
$watcher.IncludeSubdirectories = $true
$watcher.EnableRaisingEvents = $true

$action = {
    Write-Host "`n[$(Get-Date -Format 'HH:mm:ss')] Server files changed. Restarting..." -ForegroundColor Yellow
    # 재시작 로직
}

Register-ObjectEvent $watcher "Changed" -Action $action
Write-Host "Watching server files for changes..."
```

### 2. package.json 스크립트 개선

**개선된 package.json scripts**:

```json
{
  "scripts": {
    "dev": "cross-env NODE_ENV=development tsx server/index.ts",
    "dev:win": "powershell -ExecutionPolicy Bypass -File scripts/dev-server.ps1",
    "dev:check": "powershell -ExecutionPolicy Bypass -File scripts/check-server.ps1",
    "dev:watch": "powershell -ExecutionPolicy Bypass -File scripts/watch-server.ps1",
    "test:server": "npm run dev:check && echo Server is ready for testing",
    "test:full": "npm run test:server && npm run test && npm run test:e2e"
  }
}
```

**필요한 패키지**:
```bash
npm install --save-dev cross-env
```

### 3. 테스트 자동화 스크립트

#### 3.1 통합 테스트 스크립트

**파일**: `scripts/test-integration.ps1`

```powershell
# scripts/test-integration.ps1
param(
    [string]$TestType = "quick"  # quick, full, gold, combat
)

Write-Host "🧪 Starting Integration Test: $TestType" -ForegroundColor Cyan

# 1. 서버 상태 확인
Write-Host "`n[1/5] Checking server status..." -ForegroundColor Yellow
& npm run dev:check
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Server is not running. Starting server..." -ForegroundColor Red
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "npm run dev:win"
    Start-Sleep -Seconds 10
}

# 2. 브라우저 열기
Write-Host "`n[2/5] Opening browser..." -ForegroundColor Yellow
Start-Process "http://localhost:5000"

# 3. 테스트 시나리오 안내
Write-Host "`n[3/5] Test scenarios:" -ForegroundColor Yellow
switch ($TestType) {
    "quick" {
        Write-Host "  - Start new game"
        Write-Host "  - Select Stage 1"
        Write-Host "  - Click TEST button"
        Write-Host "  - Create Triple hand"
        Write-Host "  - Click 'Kill Enemy' button"
        Write-Host "  - Verify gold reward"
    }
    "gold" {
        Write-Host "  - Test gold reward system"
        Write-Host "  - Verify gold updates in shop"
    }
    "combat" {
        Write-Host "  - Test combat system"
        Write-Host "  - Test damage calculation"
    }
    "full" {
        Write-Host "  - Full game flow test"
    }
}

# 4. 대기 및 확인
Write-Host "`n[4/5] Waiting for manual test completion..." -ForegroundColor Yellow
$response = Read-Host "Press Enter when test is complete (or 'f' for failed)"

# 5. 결과 확인
Write-Host "`n[5/5] Test result: $response" -ForegroundColor $(if ($response -eq 'f') { 'Red' } else { 'Green' })
```

### 4. 테스트 체크리스트 자동화

#### 4.1 테스트 체크리스트 검증 스크립트

**파일**: `scripts/verify-test-checklist.ps1`

```powershell
# scripts/verify-test-checklist.ps1
# 테스트 체크리스트 자동 검증

$checklist = @{
    "ServerRunning" = $false
    "BrowserAccessible" = $false
    "GameStarts" = $false
    "TestPanelOpens" = $false
    "NoConsoleErrors" = $false
    "NoServerErrors" = $false
}

Write-Host "🔍 Verifying Test Checklist..." -ForegroundColor Cyan

# 1. 서버 실행 확인
Write-Host "`n[ ] Server is running..."
$portCheck = netstat -ano | findstr ":5000"
if ($portCheck) {
    $checklist["ServerRunning"] = $true
    Write-Host "  ✅ Server is running" -ForegroundColor Green
} else {
    Write-Host "  ❌ Server is NOT running" -ForegroundColor Red
}

# 2. 브라우저 접근 확인
Write-Host "`n[ ] Browser can access server..."
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5000" -TimeoutSec 5 -UseBasicParsing
    if ($response.StatusCode -eq 200) {
        $checklist["BrowserAccessible"] = $true
        Write-Host "  ✅ Browser can access server" -ForegroundColor Green
    }
} catch {
    Write-Host "  ❌ Browser cannot access server" -ForegroundColor Red
}

# 결과 요약
Write-Host "`n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━" -ForegroundColor Cyan
Write-Host "Test Checklist Summary:" -ForegroundColor Cyan
$allPassed = $true
foreach ($item in $checklist.GetEnumerator()) {
    $status = if ($item.Value) { "✅" } else { "❌" }
    $color = if ($item.Value) { "Green" } else { "Red" }
    Write-Host "  $status $($item.Key)" -ForegroundColor $color
    if (-not $item.Value) { $allPassed = $false }
}

if ($allPassed) {
    Write-Host "`n✅ All automated checks passed!" -ForegroundColor Green
    Write-Host "⚠️  Manual testing still required (game start, test panel, etc.)" -ForegroundColor Yellow
} else {
    Write-Host "`n❌ Some checks failed. Please fix before testing." -ForegroundColor Red
    exit 1
}
```

### 5. 브라우저 자동화 개선

#### 5.1 Playwright 기반 E2E 테스트

**파일**: `tests/e2e/gold-reward.test.ts`

```typescript
import { test, expect } from '@playwright/test';

test.describe('Gold Reward System', () => {
  test('should award gold when enemy is defeated', async ({ page }) => {
    // 1. 게임 시작
    await page.goto('http://localhost:5000');
    await page.click('text=START NEW GAME');
    await page.waitForURL(/\/stage-select/);
    
    // 2. Stage 1 선택
    await page.click('text=START STAGE 1');
    await page.waitForURL(/\/game/);
    
    // 3. TEST 패널 열기
    await page.click('button:has-text("TEST")');
    await page.waitForSelector('text=테스트 도구');
    
    // 4. Triple 족보 생성
    await page.click('button:has-text("Triple")');
    await page.waitForSelector('text=선택된 족보: Triple');
    
    // 5. 적 처치
    await page.click('button:has-text("적 처치")');
    await page.waitForTimeout(2000);
    
    // 6. 골드 확인 (상점으로 이동했는지 확인)
    const goldText = await page.textContent('text=/$');
    expect(goldText).toContain('$3');
    
    // 7. 콘솔 오류 확인
    const errors = [];
    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    
    expect(errors.length).toBe(0);
  });
});
```

**설치**:
```bash
npm install --save-dev @playwright/test
npx playwright install
```

### 6. 테스트 도구 개선

#### 6.1 테스트 패널 상태 저장

**개선 사항**: 테스트 패널 상태를 localStorage에 저장하여 페이지 새로고침 후에도 유지

**파일**: `client/src/pages/GameScreen.tsx` (수정)

```typescript
// 테스트 패널 상태 저장
useEffect(() => {
  const saved = localStorage.getItem('testPanelOpen');
  if (saved === 'true') {
    setShowTestPanel(true);
  }
}, []);

useEffect(() => {
  localStorage.setItem('testPanelOpen', showTestPanel.toString());
}, [showTestPanel]);
```

#### 6.2 테스트 시나리오 저장/로드

**개선 사항**: 자주 사용하는 테스트 시나리오를 저장하고 재사용

```typescript
// 테스트 시나리오 저장
const saveTestScenario = (name: string, scenario: TestScenario) => {
  const saved = JSON.parse(localStorage.getItem('testScenarios') || '[]');
  saved.push({ name, ...scenario });
  localStorage.setItem('testScenarios', JSON.stringify(saved));
};

// 테스트 시나리오 로드
const loadTestScenario = (name: string) => {
  const saved = JSON.parse(localStorage.getItem('testScenarios') || '[]');
  const scenario = saved.find((s: any) => s.name === name);
  if (scenario) {
    // 시나리오 실행
    executeScenario(scenario);
  }
};
```

### 7. 문서화 및 가이드 개선

#### 7.1 빠른 시작 가이드

**파일**: `docs/QUICK_TEST_GUIDE.md`

```markdown
# 빠른 테스트 가이드

## 🚀 1분 테스트

### Windows 환경
```powershell
# 서버 시작
npm run dev:win

# 새 터미널에서
npm run dev:check
```

### 테스트 실행
1. 브라우저에서 `http://localhost:5000` 열기
2. TEST 버튼 클릭
3. Triple 버튼 클릭
4. "적 처치" 버튼 클릭
5. 골드 확인 ($3)

## ⚡ 자동화 테스트
```powershell
npm run test:integration quick
```

## 🔍 체크리스트 검증
```powershell
npm run verify-checklist
```
```

#### 7.2 문제 해결 가이드

**파일**: `docs/TESTING_TROUBLESHOOTING.md`

```markdown
# 테스트 문제 해결 가이드

## 문제: 서버가 시작되지 않음

### 증상
- `npm run dev` 실행 시 오류
- 포트 5000이 사용 중

### 해결 방법
1. 기존 서버 프로세스 종료
   ```powershell
   netstat -ano | findstr :5000
   taskkill /PID <PID> /F
   ```

2. Windows 호환 스크립트 사용
   ```powershell
   npm run dev:win
   ```

## 문제: 브라우저 자동화 실패

### 증상
- 요소를 찾을 수 없음
- 타임아웃 발생

### 해결 방법
1. 수동 테스트로 대체
2. 테스트 도구(TEST 버튼) 사용
3. Playwright 설치 및 사용
```

### 8. CI/CD 통합 (선택사항)

#### 8.1 GitHub Actions 워크플로우

**파일**: `.github/workflows/test.yml`

```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: windows-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
      
      - name: Install dependencies
        run: npm ci
      
      - name: Start server
        run: npm run dev:win
        env:
          NODE_ENV: development
      
      - name: Wait for server
        run: |
          timeout /t 10
          npm run dev:check
      
      - name: Run tests
        run: npm test
      
      - name: Run E2E tests
        run: npx playwright test
```

## 📊 우선순위별 구현 계획

### 🔴 높은 우선순위 (즉시 구현)

1. **Windows 호환 서버 시작 스크립트**
   - 구현 시간: 30분
   - 효과: 서버 시작 문제 해결

2. **서버 상태 확인 스크립트**
   - 구현 시간: 20분
   - 효과: 서버 상태 명확히 확인

3. **package.json 스크립트 개선**
   - 구현 시간: 10분
   - 효과: 크로스 플랫폼 호환성

### 🟡 중간 우선순위 (단기 구현)

4. **테스트 체크리스트 검증 스크립트**
   - 구현 시간: 1시간
   - 효과: 테스트 생략 방지

5. **테스트 패널 상태 저장**
   - 구현 시간: 30분
   - 효과: 테스트 재개 용이

6. **빠른 시작 가이드**
   - 구현 시간: 30분
   - 효과: 테스트 시작 시간 단축

### 🟢 낮은 우선순위 (장기 구현)

7. **Playwright E2E 테스트**
   - 구현 시간: 4시간
   - 효과: 자동화 테스트 강화

8. **테스트 시나리오 저장/로드**
   - 구현 시간: 2시간
   - 효과: 테스트 효율성 향상

9. **CI/CD 통합**
   - 구현 시간: 3시간
   - 효과: 지속적 테스트

## ✅ 구현 체크리스트

- [ ] Windows 호환 서버 시작 스크립트
- [ ] 서버 상태 확인 스크립트
- [ ] package.json 스크립트 개선
- [ ] 테스트 체크리스트 검증 스크립트
- [ ] 테스트 패널 상태 저장
- [ ] 빠른 시작 가이드
- [ ] 문제 해결 가이드
- [ ] Playwright E2E 테스트 (선택)
- [ ] 테스트 시나리오 저장/로드 (선택)
- [ ] CI/CD 통합 (선택)

## 📝 사용 예시

### 일상적인 테스트 워크플로우

```powershell
# 1. 서버 시작
npm run dev:win

# 2. 새 터미널에서 상태 확인
npm run dev:check

# 3. 체크리스트 검증
npm run verify-checklist

# 4. 브라우저에서 수동 테스트
# http://localhost:5000 접속 → TEST 버튼 사용

# 5. 자동화 테스트 (선택)
npm run test:integration quick
```

## 🎯 기대 효과

1. **테스트 생략 방지**: 자동화된 체크리스트로 누락 방지
2. **테스트 시간 단축**: 스크립트로 반복 작업 자동화
3. **문제 조기 발견**: 자동 검증으로 빠른 피드백
4. **크로스 플랫폼 호환**: Windows/Mac/Linux 모두 지원
5. **문서화 강화**: 명확한 가이드로 학습 곡선 단축

---

**마지막 업데이트**: 2024년
**상태**: 제안 단계 (구현 대기)



