/**
 * 순차 발동 시스템 테스트 스크립트
 */

import { activateDicesSequentially } from './shared/diceActivation.js';
import type { Dice, Joker } from './shared/schema.js';

// 테스트 데이터 준비
const testDices: Dice[] = [
  { id: 0, value: 1, suit: '♠', locked: true },
  { id: 1, value: 2, suit: '♦', locked: true },
  { id: 2, value: 3, suit: '♥', locked: true },
  { id: 3, value: 4, suit: '♣', locked: true },
  { id: 4, value: 5, suit: '♠', locked: true },
];

const testJokers: Joker[] = [
  { id: 'joker', name: 'Joker', description: '+4 Mult', effect: '+4 Mult' },
  { id: 'greedy', name: 'Greedy Joker', description: 'Diamond suit gives +3 Mult', effect: 'Diamond suit gives +3 Mult' },
];

const handMultiplier = 1; // Pair
const handUpgrades = {};

console.log('=== 순차 발동 시스템 테스트 ===\n');
console.log('주사위:', testDices.map(d => `${d.value}${d.suit}`).join(', '));
console.log('조커:', testJokers.map(j => j.name).join(', '));
console.log('족보 Multiplier:', handMultiplier);
console.log('\n--- 순차 발동 실행 ---\n');

// 순차 발동 실행
const result = activateDicesSequentially(
  testDices,
  testJokers,
  handMultiplier,
  handUpgrades
);

// 결과 출력
console.log('발동 결과:');
result.activations.forEach((activation, index) => {
  console.log(`\n[${index + 1}] 주사위 ${activation.dice.value}${activation.dice.suit}:`);
  console.log(`  - Chips: ${activation.chips}`);
  console.log(`  - Multiplier: ${activation.multiplier}`);
  console.log(`  - 적용된 조커 효과:`);
  if (activation.jokerEffects.length === 0) {
    console.log(`    (없음)`);
  } else {
    activation.jokerEffects.forEach(effect => {
      console.log(`    - ${effect.jokerName}: +${effect.multBonus} Mult`);
    });
  }
  if (activation.retriggered) {
    console.log(`  - 재발동됨!`);
  }
});

console.log('\n--- 최종 결과 ---');
console.log(`전체 Chips: ${result.totalChips}`);
console.log(`전체 Multiplier: ${result.totalMultiplier}`);
console.log(`최종 데미지: ${result.finalDamage}`);

// 예상 결과와 비교
const expectedChips = testDices.reduce((sum, d) => sum + d.value, 0);
const expectedMult = handMultiplier + (testJokers.length * 4); // Joker는 +4 Mult
const expectedDamage = expectedChips * (expectedMult + 1);

console.log('\n--- 검증 ---');
console.log(`예상 Chips: ${expectedChips}`);
console.log(`예상 Multiplier: ${expectedMult}`);
console.log(`예상 데미지: ${expectedDamage}`);
console.log(`실제 데미지: ${result.finalDamage}`);
console.log(`일치 여부: ${result.finalDamage === expectedDamage ? '✅' : '❌'}`);



