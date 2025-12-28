#!/bin/bash

cd /Users/dwmoon/Downloads/Dice-Balatro

echo "🚀 서버 시작 테스트..."
echo ""

# 환경 변수 설정 (DATABASE_URL 없이 - 메모리 스토리지 사용)
export PORT=5000
export NODE_ENV=development
# DATABASE_URL을 설정하지 않으면 InMemoryStorage 사용

echo "📋 환경 변수:"
echo "   PORT=$PORT"
echo "   NODE_ENV=$NODE_ENV"
echo "   DATABASE_URL=${DATABASE_URL:-'(설정 안됨 - 메모리 스토리지 사용)'}"
echo ""

echo "🔍 서버 실행 중..."
npm run dev

