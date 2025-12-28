# 서버 실행 안내

## ⚠️ 현재 상황

의존성 설치가 시스템 권한 문제로 자동 실행되지 않았습니다. 수동으로 설치해야 합니다.

## 🚀 서버 실행 방법

### 1단계: 의존성 설치

터미널에서 다음 명령어를 실행하세요:

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro
npm install
```

**만약 권한 문제가 발생하면:**
```bash
# npm 캐시 정리 후 재시도
npm cache clean --force
npm install

# 또는 npx 사용
npx npm install
```

### 2단계: 환경 변수 설정

데이터베이스 연결을 위해 `.env` 파일을 생성하거나 환경 변수를 설정하세요:

```bash
# .env 파일 생성 (프로젝트 루트에)
echo "DATABASE_URL=your_database_connection_string" > .env
echo "PORT=5000" >> .env
echo "NODE_ENV=development" >> .env
```

**또는 환경 변수로 직접 설정:**
```bash
export DATABASE_URL="your_database_connection_string"
export PORT=5000
export NODE_ENV=development
```

### 3단계: 데이터베이스 마이그레이션 (필요한 경우)

```bash
npm run db:push
```

### 4단계: 서버 실행

```bash
# 개발 서버 실행
npm run dev

# 또는 클라이언트만 실행 (Vite 개발 서버)
npm run dev:client
```

서버가 성공적으로 시작되면:
- 서버: `http://localhost:5000`
- API: `http://localhost:5000/api/*`

## ✅ 적용된 개선 사항 확인

서버가 실행되면 다음 개선 사항들이 적용되어 있습니다:

1. **에러 처리 개선**
   - 일관된 에러 응답 형식
   - Zod 검증 에러 자동 처리
   - 구조화된 에러 메시지

2. **타입 안정성**
   - 모든 `as any` 제거
   - 타입 가드 함수로 안전한 타입 체크

3. **입력 검증**
   - 모든 API 엔드포인트에 검증 스키마 적용
   - 잘못된 입력 시 상세한 에러 메시지

## 🧪 빠른 테스트

서버가 실행되면 다음 명령어로 테스트할 수 있습니다:

```bash
# 새 게임 생성
curl -X POST http://localhost:5000/api/games/new

# 응답에서 gameId를 복사한 후
# 게임 세션 조회
curl http://localhost:5000/api/games/{gameId}

# 주사위 굴리기
curl -X POST http://localhost:5000/api/games/{gameId}/roll \
  -H "Content-Type: application/json" \
  -d '{"lockedDices": []}'
```

## 🔍 문제 해결

### "Cannot find module" 에러
의존성이 제대로 설치되지 않았습니다:
```bash
rm -rf node_modules package-lock.json
npm install
```

### "DATABASE_URL must be set" 에러
환경 변수를 설정하세요:
```bash
export DATABASE_URL="your_database_url"
```

### 포트가 이미 사용 중
다른 포트를 사용하거나 기존 프로세스를 종료하세요:
```bash
# 포트 5000 사용 중인 프로세스 확인
lsof -i :5000

# 프로세스 종료
kill -9 <PID>
```

## 📝 참고

- 모든 개선 사항은 코드에 이미 적용되어 있습니다
- 서버 실행 후 브라우저에서 `http://localhost:5000` 접속
- API 테스트는 `TEST_GUIDE.md` 참고

