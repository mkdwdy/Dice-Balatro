# 빠른 테스트 가이드

> ⚡ **목적**: 테스트를 빠르고 원활하게 시작하기 위한 가이드

## 🚀 1분 빠른 시작

### Windows 환경

```powershell
# 1. 서버 시작 (새 터미널)
npm run dev:win

# 2. 서버 상태 확인 (새 터미널)
npm run dev:check

# 3. 브라우저에서 테스트
# http://localhost:5000 접속
# TEST 버튼 클릭 → Triple → "적 처치" → 골드 확인
```

### Mac/Linux 환경

```bash
# 1. 서버 시작
npm run dev

# 2. 브라우저에서 테스트
# http://localhost:5000 접속
```

## 📋 테스트 체크리스트 자동 검증

```powershell
# 모든 자동 검증 항목 확인
npm run test:checklist

# 서버 상태만 확인
npm run test:server
```

## 🎯 일반적인 테스트 시나리오

### 골드 수급 테스트

1. 게임 시작 → Stage 1 선택
2. TEST 버튼 클릭
3. Triple 버튼 클릭 (족보 생성)
4. "적 처치 (골드 획득 테스트)" 버튼 클릭
5. 골드 확인 ($0 → $3)
6. 상점 화면으로 이동 확인

### 전투 시스템 테스트

1. 게임 시작 → Stage 1 선택
2. TEST 버튼 클릭
3. Pair/Triple/Straight 등 족보 생성
4. "적 처치" 버튼 클릭
5. 데미지 확인 (적 HP 감소)
6. 플레이어 HP 확인 (적 공격 받음)

## 🔧 문제 해결

### 서버가 시작되지 않음

```powershell
# 1. 기존 프로세스 확인
netstat -ano | findstr :5000

# 2. 프로세스 종료 (필요시)
taskkill /PID <PID> /F

# 3. Windows 호환 스크립트 사용
npm run dev:win
```

### 브라우저에서 접속 불가

```powershell
# 서버 상태 확인
npm run dev:check

# 서버가 실행 중이 아니면
npm run dev:win
```

### 테스트 패널이 닫힘

- 테스트 패널 상태는 자동으로 저장됩니다
- 페이지를 새로고침해도 이전 상태가 유지됩니다
- 수동으로 TEST 버튼을 다시 클릭할 수도 있습니다

## 📝 테스트 결과 보고 형식

```
## 테스트 결과

### 테스트 방법
1. 게임 시작 → Stage 1 선택
2. TEST 버튼 클릭 → Triple 생성
3. "적 처치" 버튼 클릭
4. 골드 확인

### 테스트 결과
- ✅ 골드 수급 정상 작동 ($0 → $3)
- ✅ 상점으로 이동 확인
- ✅ 오류 없음

### 문제 발견
없음
```

## ⚡ 빠른 명령어 참조

| 명령어 | 설명 |
|--------|------|
| `npm run dev:win` | Windows에서 서버 시작 |
| `npm run dev:check` | 서버 상태 확인 |
| `npm run test:checklist` | 테스트 체크리스트 검증 |
| `npm run test:server` | 서버 상태만 확인 |

## 🎓 팁

1. **테스트 패널 활용**: TEST 버튼으로 빠른 테스트 가능
2. **콘솔 확인**: F12로 브라우저 콘솔 확인 (오류 체크)
3. **서버 로그 확인**: 서버 실행 터미널에서 로그 확인
4. **자동 검증**: `npm run test:checklist`로 기본 사항 자동 확인

---

**마지막 업데이트**: 2024년



