/**
 * 주사위 순차 발동 시스템
 * 발라트로의 핵심 메커니즘: 주사위를 하나씩 순차적으로 발동하며 각 주사위마다 조커 효과를 적용
 */

import type { Dice, Joker, DeckDice } from './schema';

/**
 * 주사위 발동 결과
 */
export interface DiceActivationResult {
  dice: Dice;
  chips: number; // 해당 주사위의 Chips
  multiplier: number; // 해당 주사위의 Multiplier
  jokerEffects: JokerEffect[]; // 적용된 조커 효과들
  retriggered: boolean; // 재발동 여부
}

/**
 * 조커 효과 결과
 */
export interface JokerEffect {
  jokerId: string;
  jokerName: string;
  chipsBonus: number; // Chips 보너스
  multBonus: number; // Multiplier 보너스
  multMultiplier: number; // Multiplier 배수 (예: x2)
  retrigger: boolean; // 재발동 트리거 여부
}

/**
 * 순차 발동 전체 결과
 */
export interface SequentialActivationResult {
  activations: DiceActivationResult[]; // 각 주사위의 발동 결과
  totalChips: number; // 전체 Chips 합계
  totalMultiplier: number; // 전체 Multiplier 합계
  finalDamage: number; // 최종 데미지 (Chips * (Multiplier + 1))
}

/**
 * 주사위 순차 발동
 * 잠긴 주사위를 왼쪽부터 순차적으로 발동하며 각 주사위마다 조커 효과를 적용
 * 
 * @param lockedDices 잠긴 주사위 배열 (왼쪽부터 순서대로)
 * @param jokers 보유한 조커 배열 (순서대로 적용)
 * @param handMultiplier 족보 Multiplier
 * @param handUpgrades 족보 업그레이드 보너스
 * @param handName 족보 이름 (조커 효과 계산용)
 * @returns 순차 발동 결과
 */
export function activateDicesSequentially(
  lockedDices: Dice[],
  jokers: Joker[],
  handMultiplier: number,
  handUpgrades: Record<string, number> = {},
  handName: string = ''
): SequentialActivationResult {
  const activations: DiceActivationResult[] = [];
  let totalChips = 0;
  let totalMultiplier = handMultiplier;

  // 족보 업그레이드 보너스 적용
  // (현재는 handMultiplier에 이미 포함되어 있다고 가정)

  // 각 주사위를 순차적으로 발동
  for (const dice of lockedDices) {
    const activation = activateSingleDice(dice, jokers, activations, handName, lockedDices);
    activations.push(activation);
    
    // 발라트로 방식: 각 주사위의 Chips만 누적
    totalChips += activation.chips;
    // Multiplier는 각 주사위 발동 시 계산하되, 전체 Multiplier에 누적
    // (각 주사위마다 조커 효과로 증가한 Multiplier를 전체에 누적)
    totalMultiplier += activation.multiplier;
    
    // 재발동 처리
    if (activation.retriggered) {
      // 재발동: 같은 주사위를 다시 발동
      const retriggerActivation = activateSingleDice(dice, jokers, activations, handName, lockedDices);
      activations.push(retriggerActivation);
      
      // 재발동 시에도 Chips와 Multiplier 누적
      totalChips += retriggerActivation.chips;
      totalMultiplier += retriggerActivation.multiplier;
    }
  }

  // Multiplier 배수 적용 (조커 효과에서 누적된 배수)
  // 발라트로 방식: 배수는 전체 Multiplier에 곱하기
  let finalMultiplier = totalMultiplier;
  for (const activation of activations) {
    for (const effect of activation.jokerEffects) {
      if (effect.multMultiplier !== 1) {
        finalMultiplier *= effect.multMultiplier;
      }
    }
  }

  // 최종 데미지 계산: 전체 Chips * (전체 Multiplier + 1)
  // 발라트로 방식: 각 주사위의 Chips를 누적한 totalChips에 전체 Multiplier를 한 번만 적용
  const finalDamage = Math.round(totalChips * (finalMultiplier + 1));

  return {
    activations,
    totalChips,
    totalMultiplier: finalMultiplier,
    finalDamage,
  };
}

/**
 * 단일 주사위 발동
 * 
 * @param dice 발동할 주사위
 * @param jokers 보유한 조커 배열
 * @param previousActivations 이전 발동 결과들 (재발동 시 참고)
 * @param handName 족보 이름 (조커 효과 계산용)
 * @param allActiveDices 모든 활성화된 주사위 (족보 확인용)
 * @returns 주사위 발동 결과
 */
function activateSingleDice(
  dice: Dice,
  jokers: Joker[],
  previousActivations: DiceActivationResult[],
  handName: string = '',
  allActiveDices: Dice[] = []
): DiceActivationResult {
  // 기본 Chips는 주사위 값
  let chips = dice.value;
  let multiplier = 0;
  const jokerEffects: JokerEffect[] = [];
  let retriggered = false;

  // 조커를 순서대로 적용
  for (const joker of jokers) {
    const effect = calculateJokerEffect(joker, dice, previousActivations, handName, allActiveDices);
    
    if (effect) {
      chips += effect.chipsBonus;
      multiplier += effect.multBonus;
      
      // Multiplier 배수는 나중에 적용되므로 기록만
      jokerEffects.push(effect);
      
      if (effect.retrigger) {
        retriggered = true;
      }
    }
  }

  return {
    dice,
    chips,
    multiplier,
    jokerEffects,
    retriggered,
  };
}

/**
 * 조커 효과 계산
 * 
 * @param joker 조커
 * @param dice 현재 발동 중인 주사위
 * @param previousActivations 이전 발동 결과들
 * @param handName 족보 이름 (족보별 효과용)
 * @param allActiveDices 모든 활성화된 주사위 (족보 확인용)
 * @returns 조커 효과 (없으면 null)
 */
function calculateJokerEffect(
  joker: Joker,
  dice: Dice,
  previousActivations: DiceActivationResult[],
  handName: string = '',
  allActiveDices: Dice[] = []
): JokerEffect | null {
  const jokerId = joker.id.toLowerCase();
  const jokerName = joker.name.toLowerCase();

  // 1. 기본 조커: +4 Mult (항상 적용)
  if (jokerId === 'joker') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 4,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // 2. 슈트별 조커들 (주사위 발동 시 해당 슈트면 효과 적용)
  if (jokerId === 'greedy_joker' && dice.suit === '♦') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 3,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  if (jokerId === 'lusty_joker' && dice.suit === '♥') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 3,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  if (jokerId === 'wrathful_joker' && dice.suit === '♠') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 3,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  if (jokerId === 'gluttonous_joker' && dice.suit === '♣') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 3,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // 3. 족보별 조커들 (족보가 맞으면 효과 적용, 각 주사위마다 체크)
  // Jolly Joker: Pair일 때 +8 Mult
  if (jokerId === 'jolly_joker' && handName === 'Pair') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 8,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Zany Joker: Triple일 때 +12 Mult
  if (jokerId === 'zany_joker' && handName === 'Triple') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 12,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Mad Joker: Two Pair일 때 +10 Mult
  if (jokerId === 'mad_joker' && handName === 'Two Pair') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 10,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Crazy Joker: Straight일 때 +12 Mult (Straight 3, 4, 5 모두 포함)
  if (jokerId === 'crazy_joker' && (handName === 'Straight 3' || handName === 'Straight 4' || handName === 'Straight 5')) {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 12,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Droll Joker: Flush일 때 +10 Mult
  if (jokerId === 'droll_joker' && handName === 'Flush') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 10,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // 4. Chips 보너스 조커들
  // Sly Joker: Pair일 때 +50 Chips
  if (jokerId === 'sly_joker' && handName === 'Pair') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 50,
      multBonus: 0,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Wily Joker: Triple일 때 +100 Chips
  if (jokerId === 'wily_joker' && handName === 'Triple') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 100,
      multBonus: 0,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Clever Joker: Two Pair일 때 +80 Chips
  if (jokerId === 'clever_joker' && handName === 'Two Pair') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 80,
      multBonus: 0,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Devious Joker: Straight일 때 +100 Chips
  if (jokerId === 'devious_joker' && (handName === 'Straight 3' || handName === 'Straight 4' || handName === 'Straight 5')) {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 100,
      multBonus: 0,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Crafty Joker: Flush일 때 +80 Chips
  if (jokerId === 'crafty_joker' && handName === 'Flush') {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 80,
      multBonus: 0,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Half Joker: 3개 이하 주사위로 만든 족보일 때 +20 Mult
  if (jokerId === 'half_joker' && allActiveDices.length <= 3) {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 20,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Fibonacci: 값 1, 2, 3, 5, 8일 때 +8 Mult
  if (jokerId === 'fibonacci' && (dice.value === 1 || dice.value === 2 || dice.value === 3 || dice.value === 5 || dice.value === 8)) {
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 8,
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // Abstract Joker: 조커 개수당 +3 Mult (현재는 조커 배열 길이 사용)
  // 주의: 이 효과는 조커 배열 길이를 알아야 하므로, calculateJokerEffect에 jokers 배열을 전달해야 함
  // 일단 기본 효과만 구현 (나중에 확장)
  if (jokerId === 'abstract_joker') {
    // 조커 개수는 외부에서 계산되어야 하므로, 일단 기본값 사용
    // TODO: jokers 배열을 파라미터로 추가 필요
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 0, // 조커 개수 * 3은 외부에서 계산 필요
      multMultiplier: 1,
      retrigger: false,
    };
  }

  // 5. 상점에서 구매 가능한 조커들
  // Lucky Joker (joker_1): 모든 족보에 +10% 데미지 (multiplier로 구현)
  if (jokerId === 'joker_1' || joker.effect === 'damage_boost') {
    // +10% 데미지는 최종 데미지에 곱하기보다는 multiplier에 작은 보너스를 주는 방식
    // 발라트로 방식: multiplier에 작은 보너스 추가 (약 0.1 정도)
    // 하지만 multiplier는 정수이므로, 대신 모든 주사위에 작은 chips 보너스 추가
    // 또는 최종 데미지에 1.1을 곱하는 방식 (multMultiplier 사용)
    return {
      jokerId: joker.id,
      jokerName: joker.name,
      chipsBonus: 0,
      multBonus: 0,
      multMultiplier: 1.1, // 최종 multiplier에 1.1 곱하기 (10% 증가)
      retrigger: false,
    };
  }

  // Suit Master (joker_2): Flush에 +2 multiplier
  if (jokerId === 'joker_2' || joker.effect === 'flush_boost') {
    if (handName === 'Flush') {
      return {
        jokerId: joker.id,
        jokerName: joker.name,
        chipsBonus: 0,
        multBonus: 2,
        multMultiplier: 1,
        retrigger: false,
      };
    }
    return null;
  }

  // Pair Power (joker_3): Pair를 Triple로 취급
  if (jokerId === 'joker_3' || joker.effect === 'pair_upgrade') {
    // Pair일 때 Triple 효과 적용
    if (handName === 'Pair') {
      // Triple 효과: +12 Mult (Zany Joker와 동일)
      return {
        jokerId: joker.id,
        jokerName: joker.name,
        chipsBonus: 0,
        multBonus: 12,
        multMultiplier: 1,
        retrigger: false,
      };
    }
    return null;
  }

  // 기본적으로 효과 없음
  return null;
}

