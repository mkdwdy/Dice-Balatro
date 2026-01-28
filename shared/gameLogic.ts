import type { DeckDice, DiceFace, Dice } from './schema';

/**
 * 스테이지별 통계 계산
 * @param stage 스테이지 번호 (1부터 시작)
 * @returns 스테이지별 적 HP, 골드 보상, 적 데미지
 */
export function getStageStats(stage: number) {
  const baseHp = 100;
  const baseReward = 3;
  const stageMultiplier = 1 + (stage - 1) * 0.5;
  
  return {
    enemyHp: Math.round(baseHp * stageMultiplier),
    goldReward: Math.round(baseReward * stageMultiplier),
    enemyDamage: Math.round(10 + (stage - 1) * 2),
  };
}

/**
 * 값 카운트 헬퍼 함수
 */
function countValues(values: number[]): Record<number, number> {
  return values.reduce((acc, v) => ({ ...acc, [v]: ((acc as Record<number, number>)[v] || 0) + 1 }), {} as Record<number, number>);
}

/**
 * 족보에 사용된 주사위만 필터링하여 반환
 * 발라트로 방식: 족보에 실제로 사용된 주사위만 발동
 * 
 * @param handName 족보 이름
 * @param lockedDices 잠긴 주사위 배열
 * @returns 족보에 사용된 주사위 배열
 */
export function getActiveDicesForHand(handName: string, lockedDices: Dice[]): Dice[] {
  if (lockedDices.length === 0) return [];

  const values = lockedDices.map(d => d.value).sort((a, b) => b - a);
  const counts = countValues(lockedDices.map(d => d.value));
  const sortedDices = [...lockedDices].sort((a, b) => b.value - a.value);

  switch (handName) {
    case 'Yahtzee':
    case 'Straight Flush':
    case 'Straight 5':
    case 'Flush':
      // 모든 주사위 사용
      return sortedDices;
    
    case 'Full House': {
      // 트리플 + 페어
      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sortedCounts[0]?.[1] >= 3 && sortedCounts[1]?.[1] >= 2) {
        const tripleValue = parseInt(sortedCounts[0][0]);
        const pairValue = parseInt(sortedCounts[1][0]);
        return sortedDices.filter(d => d.value === tripleValue || d.value === pairValue);
      }
      return sortedDices;
    }
    
    case 'Four of a Kind': {
      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sortedCounts[0]?.[1] >= 4) {
        const num = parseInt(sortedCounts[0][0]);
        return sortedDices.filter(d => d.value === num);
      }
      return sortedDices.slice(0, 4);
    }
    
    case 'Two Pair': {
      const pairs = Object.entries(counts).filter(([_, c]) => c >= 2).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
      if (pairs.length >= 2) {
        const pair1Value = parseInt(pairs[0][0]);
        const pair2Value = parseInt(pairs[1][0]);
        return sortedDices.filter(d => d.value === pair1Value || d.value === pair2Value);
      }
      return sortedDices.slice(0, 4);
    }
    
    case 'Triple': {
      const sortedCounts = Object.entries(counts).sort((a, b) => b[1] - a[1]);
      if (sortedCounts[0]?.[1] >= 3) {
        const num = parseInt(sortedCounts[0][0]);
        return sortedDices.filter(d => d.value === num);
      }
      return sortedDices.slice(0, 3);
    }
    
    case 'Straight 4':
      return sortedDices.slice(0, 4);
    
    case 'Pair': {
      const sortedCounts = Object.entries(counts).filter(([_, c]) => c >= 2).sort((a, b) => parseInt(b[0]) - parseInt(a[0]));
      if (sortedCounts[0]) {
        const num = parseInt(sortedCounts[0][0]);
        return sortedDices.filter(d => d.value === num);
      }
      return sortedDices.slice(0, 2);
    }
    
    case 'Straight 3':
      return sortedDices.slice(0, 3);
    
    case 'High Dice':
      return sortedDices.slice(0, 1);
    
    default:
      return sortedDices;
  }
}

/**
 * 초기 주사위 덱 생성
 * 5개의 주사위를 생성하며, 각 주사위는 6면체입니다.
 * 각 주사위는 고정된 슈트를 가지며, 각 면의 값은 1-6입니다.
 * @returns 초기 주사위 덱 배열
 */
export function createInitialDiceDeck(): DeckDice[] {
  const FIXED_SUITS: DiceFace['suit'][] = ['None', '♠', '♦', '♥', '♣'];
  
  return Array.from({ length: 5 }, (_, diceIndex) => {
    const suit = FIXED_SUITS[diceIndex] || 'None';
    
    // 각 주사위의 6면 생성 (값: 1-6, 슈트: 고정)
    const faces: DiceFace[] = Array.from({ length: 6 }, (_, faceIndex) => ({
      value: faceIndex + 1, // 1, 2, 3, 4, 5, 6
      suit: suit,
    }));
    
    return {
      id: diceIndex,
      faces: faces,
      currentTopFace: 0, // 초기값은 첫 번째 면
    };
  });
}
