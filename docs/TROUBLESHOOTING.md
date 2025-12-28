# 시스템 권한 문제 해결 가이드

## 🔍 문제 진단

npm install이 실패하는 경우, 여러 원인이 있을 수 있습니다:

1. **시스템 npm 권한 문제** (가장 흔한 경우)
2. **npm 캐시 문제**
3. **node_modules 폴더 권한 문제**

## ✅ 해결 방법

### 방법 1: npm 캐시 정리 후 재시도 (가장 안전)

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# npm 캐시 정리
npm cache clean --force

# 의존성 설치
npm install
```

### 방법 2: 프로젝트 폴더 권한 확인 및 수정

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# 현재 폴더 권한 확인
ls -la

# 필요시 권한 수정 (현재 사용자에게 권한 부여)
sudo chown -R $(whoami) .

# 의존성 설치
npm install
```

### 방법 3: npm을 사용하지 않고 직접 설치

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# package.json에서 직접 의존성 확인
cat package.json | grep -A 50 "dependencies"

# 또는 yarn 사용 (설치되어 있다면)
yarn install
```

### 방법 4: npx를 사용한 실행 (의존성 없이)

의존성이 설치되지 않아도, npx가 자동으로 필요한 패키지를 다운로드할 수 있습니다:

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# npx로 직접 실행 시도
NODE_ENV=development npx tsx server/index.ts
```

### 방법 5: Node 버전 관리자 사용 (권장)

nvm이나 fnm을 사용하면 권한 문제를 피할 수 있습니다:

```bash
# nvm이 설치되어 있다면
nvm use node
npm install

# 또는 fnm
fnm use node
npm install
```

## 🔧 macOS 특정 해결 방법

### Homebrew로 Node.js 재설치

```bash
# Homebrew로 Node.js 재설치
brew reinstall node

# 또는 npm만 재설치
brew reinstall npm
```

### npm 전역 설치 경로 확인

```bash
# npm 전역 경로 확인
npm config get prefix

# 전역 경로를 사용자 디렉토리로 변경
mkdir ~/.npm-global
npm config set prefix '~/.npm-global'
echo 'export PATH=~/.npm-global/bin:$PATH' >> ~/.zshrc
source ~/.zshrc
```

## 🚨 권한 오류가 계속되는 경우

### sudo 사용 (권장하지 않음, 하지만 작동함)

```bash
# ⚠️ 주의: sudo 사용은 보안상 권장하지 않지만, 작동합니다
sudo npm install
```

**하지만 이 방법은 권장하지 않습니다.** node_modules가 root 소유가 되어 나중에 문제가 될 수 있습니다.

### 대안: 프로젝트를 사용자 소유 디렉토리로 이동

```bash
# 홈 디렉토리로 프로젝트 복사
cp -r /Users/dwmoon/Downloads/Dice-Balatro ~/Dice-Balatro
cd ~/Dice-Balatro
npm install
```

## 🎯 빠른 해결책 (가장 추천)

다음 순서로 시도해보세요:

```bash
cd /Users/dwmoon/Downloads/Dice-Balatro

# 1. 기존 node_modules 제거 (있다면)
rm -rf node_modules package-lock.json

# 2. npm 캐시 정리
npm cache clean --force

# 3. npm 재설정
npm config set registry https://registry.npmjs.org/

# 4. 의존성 설치
npm install

# 5. 설치 실패 시, 상세 로그 확인
npm install --verbose 2>&1 | tee npm-install.log
```

## 📝 설치 성공 확인

설치가 성공했는지 확인:

```bash
# node_modules 확인
ls -la node_modules | head -10

# 특정 패키지 확인
ls node_modules/express
ls node_modules/react

# TypeScript 확인
npx tsc --version
```

## 🚀 설치 후 서버 실행

의존성 설치가 완료되면:

```bash
# 환경 변수 설정 (데이터베이스 필요)
export DATABASE_URL="your_database_url"
export PORT=5000
export NODE_ENV=development

# 서버 실행
npm run dev
```

## 💡 추가 팁

### npm 버전 확인 및 업데이트

```bash
# npm 버전 확인
npm --version

# npm 업데이트
npm install -g npm@latest
```

### 프로젝트별 npm 설정

```bash
# 프로젝트 루트에 .npmrc 파일 생성
echo "registry=https://registry.npmjs.org/" > .npmrc
echo "save-exact=true" >> .npmrc
```

## 🔍 문제가 계속되면

1. **에러 메시지 전체 확인**: `npm install`의 전체 출력을 확인
2. **로그 파일 확인**: `npm install --verbose`로 상세 로그 생성
3. **Node.js 버전 확인**: `node --version` (v18 이상 권장)
4. **다른 프로젝트에서도 같은 문제가 있는지 확인**

## 📞 도움이 필요한 경우

에러 메시지의 전체 내용을 확인하고, 다음 정보를 포함해서 질문하세요:
- Node.js 버전: `node --version`
- npm 버전: `npm --version`
- 운영체제: `uname -a` (macOS)
- 전체 에러 메시지

