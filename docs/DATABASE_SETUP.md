# 데이터베이스 설정 가이드

## ✅ 의존성 설치 완료!

의존성 설치는 성공적으로 완료되었습니다. 이제 데이터베이스만 설정하면 서버를 실행할 수 있습니다.

## 🗄️ 데이터베이스 옵션

### 옵션 1: PostgreSQL 로컬 설치 (권장)

#### macOS에서 Homebrew로 설치:

```bash
# PostgreSQL 설치
brew install postgresql@15

# PostgreSQL 시작
brew services start postgresql@15

# 데이터베이스 생성
createdb dice_balatro

# DATABASE_URL 설정
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/dice_balatro"
```

#### 또는 PostgreSQL 16:

```bash
brew install postgresql@16
brew services start postgresql@16
createdb dice_balatro
export DATABASE_URL="postgresql://$(whoami)@localhost:5432/dice_balatro"
```

### 옵션 2: Docker 사용 (가장 간단)

```bash
# Docker로 PostgreSQL 실행
docker run --name dice-balatro-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=dice_balatro \
  -p 5432:5432 \
  -d postgres:15

# DATABASE_URL 설정
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dice_balatro"
```

### 옵션 3: 클라우드 데이터베이스 (무료 티어)

#### Supabase (추천 - 무료):
1. https://supabase.com 접속
2. 새 프로젝트 생성
3. Settings > Database에서 Connection String 복사
4. `export DATABASE_URL="복사한_연결_문자열"`

#### Neon (추천 - 무료):
1. https://neon.tech 접속
2. 새 프로젝트 생성
3. Connection String 복사
4. `export DATABASE_URL="복사한_연결_문자열"`

#### Railway (무료):
1. https://railway.app 접속
2. 새 프로젝트 > PostgreSQL 추가
3. Connection String 복사
4. `export DATABASE_URL="복사한_연결_문자열"`

## 🚀 빠른 시작 (Docker 사용)

가장 빠르게 시작하려면:

```bash
# 1. Docker로 PostgreSQL 시작
docker run --name dice-balatro-db \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=dice_balatro \
  -p 5432:5432 \
  -d postgres:15

# 2. 환경 변수 설정
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dice_balatro"
export PORT=5000
export NODE_ENV=development

# 3. 데이터베이스 마이그레이션
npm run db:push

# 4. 서버 실행
npm run dev
```

## 📝 .env 파일 사용 (권장)

환경 변수를 매번 입력하지 않으려면 `.env` 파일을 생성하세요:

```bash
# .env 파일 생성
cat > .env << 'EOF'
DATABASE_URL=postgresql://postgres:password@localhost:5432/dice_balatro
PORT=5000
NODE_ENV=development
EOF
```

그리고 서버 실행 전에 환경 변수를 로드하도록 `package.json`의 dev 스크립트를 수정하거나, `dotenv` 패키지를 사용하세요.

## 🔧 .env 파일 자동 로드 설정

`server/index.ts`에 dotenv 추가:

```typescript
// server/index.ts 맨 위에 추가
import 'dotenv/config';
```

그리고 dotenv 설치:
```bash
npm install dotenv
```

이제 `.env` 파일이 자동으로 로드됩니다.

## ✅ 설정 확인

데이터베이스가 제대로 설정되었는지 확인:

```bash
# DATABASE_URL 확인
echo $DATABASE_URL

# PostgreSQL 연결 테스트 (psql이 설치되어 있다면)
psql $DATABASE_URL -c "SELECT version();"
```

## 🚀 서버 실행

데이터베이스 설정이 완료되면:

```bash
# 1. 마이그레이션 실행
npm run db:push

# 2. 서버 실행
npm run dev
```

서버가 성공적으로 시작되면:
- 브라우저: http://localhost:5000
- API: http://localhost:5000/api/games/new

## 🐳 Docker Compose 사용 (선택사항)

더 편리하게 관리하려면 `docker-compose.yml` 생성:

```yaml
version: '3.8'
services:
  postgres:
    image: postgres:15
    environment:
      POSTGRES_PASSWORD: password
      POSTGRES_DB: dice_balatro
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

실행:
```bash
docker-compose up -d
export DATABASE_URL="postgresql://postgres:password@localhost:5432/dice_balatro"
```

## 💡 문제 해결

### "DATABASE_URL must be set" 에러
환경 변수가 설정되지 않았습니다:
```bash
export DATABASE_URL="your_connection_string"
```

### "connection refused" 에러
PostgreSQL이 실행되지 않았습니다:
```bash
# Homebrew로 설치한 경우
brew services start postgresql@15

# Docker로 실행한 경우
docker start dice-balatro-db
```

### "database does not exist" 에러
데이터베이스를 생성하세요:
```bash
createdb dice_balatro
```

