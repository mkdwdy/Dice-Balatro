#!/bin/bash

# Dice-Balatro 서버 설정 및 실행 스크립트

set -e  # 에러 발생 시 스크립트 중단

echo "🚀 Dice-Balatro 서버 설정 시작..."
echo ""

# 프로젝트 디렉토리로 이동
cd "$(dirname "$0")"
PROJECT_DIR=$(pwd)
echo "📁 프로젝트 디렉토리: $PROJECT_DIR"
echo ""

# Node.js 버전 확인
echo "🔍 Node.js 버전 확인..."
if ! command -v node &> /dev/null; then
    echo "❌ Node.js가 설치되어 있지 않습니다."
    echo "   Homebrew로 설치: brew install node"
    exit 1
fi

NODE_VERSION=$(node --version)
echo "✅ Node.js 버전: $NODE_VERSION"
echo ""

# npm 버전 확인
echo "🔍 npm 버전 확인..."
if ! command -v npm &> /dev/null; then
    echo "❌ npm이 설치되어 있지 않습니다."
    exit 1
fi

NPM_VERSION=$(npm --version)
echo "✅ npm 버전: $NPM_VERSION"
echo ""

# npm 캐시 정리
echo "🧹 npm 캐시 정리 중..."
npm cache clean --force || echo "⚠️  캐시 정리 실패 (계속 진행)"
echo ""

# 기존 node_modules 제거 (있는 경우)
if [ -d "node_modules" ]; then
    echo "🗑️  기존 node_modules 제거 중..."
    rm -rf node_modules
fi

if [ -f "package-lock.json" ]; then
    echo "🗑️  기존 package-lock.json 제거 중..."
    rm -f package-lock.json
fi
echo ""

# 의존성 설치
echo "📦 의존성 설치 중..."
echo "   (이 작업은 몇 분이 걸릴 수 있습니다)"
echo ""

if npm install; then
    echo ""
    echo "✅ 의존성 설치 완료!"
    echo ""
else
    echo ""
    echo "❌ 의존성 설치 실패"
    echo ""
    echo "💡 해결 방법:"
    echo "   1. npm 캐시 정리: npm cache clean --force"
    echo "   2. npm 업데이트: npm install -g npm@latest"
    echo "   3. Node.js 재설치: brew reinstall node"
    echo ""
    exit 1
fi

# 환경 변수 확인
echo "🔍 환경 변수 확인..."
if [ -z "$DATABASE_URL" ]; then
    echo "⚠️  DATABASE_URL이 설정되지 않았습니다."
    echo ""
    echo "💡 환경 변수 설정 방법:"
    echo "   export DATABASE_URL='your_database_connection_string'"
    echo "   export PORT=5000"
    echo "   export NODE_ENV=development"
    echo ""
    echo "또는 .env 파일을 생성하세요:"
    echo "   echo 'DATABASE_URL=your_database_url' > .env"
    echo "   echo 'PORT=5000' >> .env"
    echo ""
    
    read -p "계속 진행하시겠습니까? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "설정을 완료한 후 다시 실행하세요."
        exit 1
    fi
else
    echo "✅ DATABASE_URL이 설정되어 있습니다."
fi
echo ""

# 데이터베이스 마이그레이션 (선택사항)
read -p "데이터베이스 마이그레이션을 실행하시겠습니까? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo "🔄 데이터베이스 마이그레이션 실행 중..."
    npm run db:push || echo "⚠️  마이그레이션 실패 (계속 진행)"
    echo ""
fi

# 서버 실행
echo "🚀 서버 시작 중..."
echo "   서버 주소: http://localhost:${PORT:-5000}"
echo "   종료하려면 Ctrl+C를 누르세요"
echo ""

npm run dev

