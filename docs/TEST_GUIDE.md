# 서버 실행 및 테스트 가이드

## ✅ 구조 검증 완료

모든 개선 사항이 올바르게 적용되었습니다:
- ✅ 에러 핸들러 구현
- ✅ 타입 안정성 개선 (as any 제거)
- ✅ 입력 검증 스키마 적용
- ✅ asyncHandler 사용
- ✅ 타입 가드 함수 추가

## 🚀 서버 실행 방법

### 1. 의존성 설치
```bash
npm install
```

### 2. 환경 변수 설정
데이터베이스가 필요합니다. `.env` 파일을 생성하거나 환경 변수를 설정하세요:
```bash
export DATABASE_URL="your_database_url"
export PORT=5000
export NODE_ENV=development
```

### 3. 데이터베이스 마이그레이션 (필요한 경우)
```bash
npm run db:push
```

### 4. 서버 실행
```bash
# 개발 서버 실행
npm run dev

# 또는 클라이언트만 실행
npm run dev:client
```

서버가 실행되면 `http://localhost:5000`에서 접속할 수 있습니다.

## 🧪 API 테스트

서버가 실행된 후 다음 명령어로 API를 테스트할 수 있습니다:

### 1. 새 게임 생성
```bash
curl -X POST http://localhost:5000/api/games/new \
  -H "Content-Type: application/json"
```

**예상 응답:**
```json
{
  "id": "uuid-here",
  "health": 100,
  "maxHealth": 100,
  "gold": 0,
  "currentStage": 0,
  "gameState": "stage_select",
  ...
}
```

### 2. 게임 세션 조회
```bash
curl http://localhost:5000/api/games/{gameId}
```

### 3. 주사위 굴리기
```bash
curl -X POST http://localhost:5000/api/games/{gameId}/roll \
  -H "Content-Type: application/json" \
  -d '{"lockedDices": []}'
```

### 4. 핸드 제출
```bash
curl -X POST http://localhost:5000/api/games/{gameId}/submit \
  -H "Content-Type: application/json" \
  -d '{"damage": 50}'
```

## ❌ 에러 케이스 테스트

### 잘못된 입력 검증 테스트
```bash
# 음수 데미지 (검증 실패)
curl -X POST http://localhost:5000/api/games/{gameId}/submit \
  -H "Content-Type: application/json" \
  -d '{"damage": -10}'
```

**예상 응답:**
```json
{
  "error": "Validation failed",
  "details": [
    {
      "path": "damage",
      "message": "Number must be greater than or equal to 0"
    }
  ]
}
```

### 존재하지 않는 게임 세션
```bash
curl http://localhost:5000/api/games/invalid-id
```

**예상 응답:**
```json
{
  "error": "Game session not found",
  "code": "SESSION_NOT_FOUND"
}
```

### 리롤 없음
```bash
# rerollsLeft가 0인 상태에서 롤 시도
curl -X POST http://localhost:5000/api/games/{gameId}/roll \
  -H "Content-Type: application/json" \
  -d '{"lockedDices": []}'
```

**예상 응답:**
```json
{
  "error": "No rerolls left",
  "code": "NO_REROLLS_LEFT"
}
```

### 골드 부족
```bash
curl -X POST http://localhost:5000/api/games/{gameId}/shop/buy \
  -H "Content-Type: application/json" \
  -d '{
    "itemType": "joker",
    "item": {
      "id": "joker_1",
      "name": "Lucky Joker",
      "description": "+10% damage",
      "effect": "damage_boost"
    },
    "cost": 1000
  }'
```

**예상 응답:**
```json
{
  "error": "Not enough gold",
  "code": "INSUFFICIENT_GOLD"
}
```

## 📊 개선 사항 확인

### Before vs After 비교

**Before (개선 전):**
- ❌ `as any` 사용으로 타입 안전성 부족
- ❌ 일관성 없는 에러 처리
- ❌ 입력 검증 없음
- ❌ `console.error`로 에러 로깅

**After (개선 후):**
- ✅ 타입 가드로 안전한 타입 체크
- ✅ 일관된 에러 응답 형식
- ✅ Zod 스키마로 강력한 입력 검증
- ✅ 구조화된 에러 핸들링

## 🔍 추가 확인 사항

서버 실행 후 다음을 확인하세요:

1. **에러 로그 형식**: 콘솔에서 구조화된 에러 로그 확인
2. **타입 안정성**: TypeScript 컴파일 에러 없음 (`npm run check`)
3. **API 응답**: 모든 API가 일관된 형식으로 응답
4. **검증 동작**: 잘못된 입력 시 적절한 에러 메시지 반환

## 💡 문제 해결

### 서버가 시작되지 않는 경우
1. `DATABASE_URL` 환경 변수가 설정되었는지 확인
2. 데이터베이스 연결 확인
3. 포트 5000이 사용 가능한지 확인

### 타입 에러가 발생하는 경우
```bash
npm run check
```
로 TypeScript 타입 체크를 실행하세요.

### 의존성 설치 문제
```bash
rm -rf node_modules package-lock.json
npm install
```

