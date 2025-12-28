/**
 * 발라트로 벤치마킹 데이터베이스 사용 예제
 * 개발 중 벤치마크 정보를 자유롭게 열람하는 방법
 */

import {
  // 데이터
  balatroJokers,
  balatroTarots,
  balatroPlanets,
  balatroSpectrals,
  balatroVouchers,
  balatroBoosters,
  benchmarkStats,
  
  // 조커 헬퍼
  getJokerById,
  getJokersByRarity,
  getJokersByType,
  searchJokers,
  
  // 행성 카드 헬퍼
  getPlanetsByPokerHand,
  
  // 바우처 헬퍼
  getBaseVouchers,
  getVoucherPair,
  
  // 부스터 헬퍼
  getBoostersByPackName,
} from './index';

console.log('📊 발라트로 벤치마킹 데이터베이스 사용 예제\n');
console.log('='.repeat(80));

// 1. 통계 확인
console.log('\n1️⃣ 데이터베이스 통계:');
console.log(benchmarkStats);

// 2. 조커 검색 예제
console.log('\n2️⃣ 조커 검색 예제:');
console.log('\n📌 전설 등급 조커:');
const legendaryJokers = getJokersByRarity('legendary');
console.log(`총 ${legendaryJokers.length}개`);
legendaryJokers.slice(0, 3).forEach(j => {
  console.log(`  - ${j.name}: ${j.description}`);
});

console.log('\n📌 "multiplier" 검색:');
const multJokers = searchJokers('multiplier');
console.log(`총 ${multJokers.length}개 결과`);
multJokers.slice(0, 3).forEach(j => {
  console.log(`  - ${j.name}: ${j.description}`);
});

// 3. 행성 카드 예제
console.log('\n3️⃣ 행성 카드 예제:');
console.log('\n📌 Pair 핸드 관련 행성 카드:');
const pairPlanets = getPlanetsByPokerHand('Pair');
pairPlanets.forEach(p => {
  console.log(`  - ${p.name}: ${p.addition} (${p.pokerHand})`);
});

// 4. 바우처 예제
console.log('\n4️⃣ 바우처 예제:');
console.log('\n📌 기본 바우처:');
const baseVouchers = getBaseVouchers();
console.log(`총 ${baseVouchers.length}개`);
baseVouchers.slice(0, 3).forEach(v => {
  console.log(`  - ${v.name}: ${v.description}`);
});

// 5. 부스터 팩 예제
console.log('\n5️⃣ 부스터 팩 예제:');
console.log('\n📌 Standard Pack:');
const standardPacks = getBoostersByPackName('Standard');
standardPacks.forEach(b => {
  console.log(`  - ${b.size} ($${b.cost}): ${b.description}`);
});

// 6. 특정 조커 찾기
console.log('\n6️⃣ 특정 조커 찾기:');
const blueprint = getJokerById('blueprint');
if (blueprint) {
  console.log(`\n📌 ${blueprint.name}:`);
  console.log(`   효과: ${blueprint.description}`);
  console.log(`   희귀도: ${blueprint.rarity}`);
  console.log(`   가격: $${blueprint.baseCost}`);
}

console.log('\n' + '='.repeat(80));
console.log('\n✅ 예제 실행 완료!');
console.log('\n💡 개발 중 벤치마크 정보를 자유롭게 열람하세요!');

