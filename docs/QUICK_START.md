# 빠른 시작 가이드

## 🎯 가장 간단한 방법

터미널에서 다음 명령어 하나만 실행하세요:

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro
./setup-and-run.sh
```

이 스크립트가 자동으로:
1. ✅ Node.js/npm 버전 확인
2. ✅ npm 캐시 정리
3. ✅ 의존성 설치
4. ✅ 환경 변수 확인
5. ✅ 서버 실행

## 📝 수동 실행 방법

스크립트를 사용하지 않으려면:

### 1단계: 의존성 설치

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# npm 캐시 정리 (권장)
npm cache clean --force

# 의존성 설치
npm install
```

### 2단계: 환경 변수 설정

```bash
# 데이터베이스 연결 문자열 설정
export DATABASE_URL="your_database_url"
export PORT=5000
export NODE_ENV=development
```

또는 `.env` 파일 생성:
```bash
cat > .env << EOF
DATABASE_URL=your_database_url
PORT=5000
NODE_ENV=development
EOF
```

### 3단계: 서버 실행

```bash
npm run dev
```

## 🔧 권한 문제 해결

만약 `npm install`이 권한 오류로 실패한다면:

### 방법 1: npm 캐시 정리
```bash
npm cache clean --force
npm install
```

### 방법 2: 프로젝트 폴더 권한 확인
```bash
# 현재 폴더 소유자 확인
ls -ld .

# 필요시 권한 수정 (보통 필요 없음)
sudo chown -R $(whoami) .
```

### 방법 3: npm 전역 경로 변경
```bash
# 사용자 디렉토리에 npm 전역 경로 설정
mkdir -p ~/.npm-global
npm config set prefix '~/.npm-global'

# PATH에 추가
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc

# 다시 설치 시도
npm install
```

## ✅ 설치 확인

의존성이 제대로 설치되었는지 확인:

```bash
# node_modules 확인
ls node_modules | head -10

# 특정 패키지 확인
ls node_modules/express
ls node_modules/react
```

## 🚀 서버 실행 확인

서버가 성공적으로 시작되면:
- 브라우저에서 `http://localhost:5000` 접속
- API 테스트: `curl http://localhost:5000/api/games/new -X POST`

## 📚 더 자세한 정보

- `TROUBLESHOOTING.md`: 상세한 문제 해결 가이드
- `SERVER_SETUP.md`: 서버 설정 상세 가이드
- `TEST_GUIDE.md`: API 테스트 가이드

