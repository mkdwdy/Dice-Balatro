# 서버 실행 가이드

## ✅ 의존성 설치 완료!

의존성 설치는 성공적으로 완료되었습니다:
- ✅ 451개 패키지 설치 완료
- ✅ express, react, drizzle-orm 등 주요 패키지 확인됨

## 🚀 서버 실행하기

### 방법 1: 환경 변수 직접 설정 (가장 빠름)

터미널에서 다음 명령어를 실행하세요:

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# 데이터베이스 연결 문자열 설정
# Docker 사용 시:
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dice_balatro"

# 또는 로컬 PostgreSQL 사용 시:
# export DATABASE_URL="postgresql://$(whoami)@localhost:5432/dice_balatro"

# 기타 환경 변수
export PORT=5000
export NODE_ENV=development

# 데이터베이스 마이그레이션
npm run db:push

# 서버 실행
npm run dev
```

### 방법 2: .env 파일 사용 (권장)

#### 1단계: .env 파일 생성

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# .env 파일 생성
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/dice_balatro
PORT=5000
NODE_ENV=development
EOF
```

#### 2단계: dotenv 설치 (선택사항, 권장)

```bash
npm install dotenv
```

#### 3단계: 서버 실행

```bash
# 데이터베이스 마이그레이션
npm run db:push

# 서버 실행
npm run dev
```

## 🗄️ 데이터베이스 설정

### 옵션 A: Docker 사용 (가장 간단)

```bash
# PostgreSQL 컨테이너 실행
docker run --name dice-balatro-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=dice_balatro \
  -p 5432:5432 \
  -d postgres:15

# DATABASE_URL 설정
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dice_balatro"
```

### 옵션 B: 로컬 PostgreSQL

```bash
# PostgreSQL 설치 (Homebrew)
brew install postgresql@15
brew services start postgresql@15

# 데이터베이스 생성
createdb dice_balatro

# DATABASE_URL 설정
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/dice_balatro"
```

### 옵션 C: 클라우드 데이터베이스 (무료)

- **Supabase**: https://supabase.com
- **Neon**: https://neon.tech
- **Railway**: https://railway.app

각 서비스에서 Connection String을 복사하여 `DATABASE_URL`에 설정하세요.

## ✅ 실행 확인

서버가 성공적으로 시작되면:

```
serving on port 5000
```

브라우저에서 `http://localhost:5000` 접속하여 게임을 플레이할 수 있습니다.

## 🧪 API 테스트

서버가 실행되면 다음 명령어로 API를 테스트할 수 있습니다:

```bash
# 새 게임 생성
curl -X POST http://localhost:5000/api/games/new

# 응답에서 gameId를 복사한 후
# 게임 세션 조회
curl http://localhost:5000/api/games/{gameId}
```

## 📝 요약

1. ✅ **의존성 설치 완료** - 이미 완료됨!
2. 🗄️ **데이터베이스 설정** - 위 옵션 중 하나 선택
3. 🔧 **환경 변수 설정** - DATABASE_URL 설정
4. 🚀 **서버 실행** - `npm run dev`

자세한 내용은 `DATABASE_SETUP.md`를 참고하세요.

