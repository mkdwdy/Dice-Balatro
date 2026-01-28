import type { BalatroJoker } from './balatro-schemas';

/**
 * 발라트로 빌드 데이터베이스
 * 
 * 발라트로의 핵심 재미 요소가 되는 빌드들을 분석하고 정리한 데이터베이스입니다.
 * 각 빌드는 특정 조커 조합과 전략을 통해 강력한 시너지를 만들어냅니다.
 */

export type BuildCategory = 
  | 'suit_based'      // 슈트 기반 빌드
  | 'hand_type'       // 족보 기반 빌드
  | 'scaling'         // 성장형 빌드
  | 'copy'            // 복제 빌드
  | 'retrigger'       // 재발동 빌드
  | 'deck_compression' // 덱 압축 빌드
  | 'economy'         // 경제 빌드
  | 'value_specific'   // 특정 값 활용 빌드
  | 'hybrid';          // 하이브리드 빌드

export type BuildTier = 'S+' | 'S' | 'A' | 'B' | 'C';

export interface BalatroBuild {
  id: string;
  name: string;
  nameKorean: string;
  description: string;
  descriptionKorean: string;
  
  // 빌드 분류
  category: BuildCategory;
  tier: BuildTier;
  
  // 핵심 조커 (필수)
  coreJokers: string[]; // 조커 ID 배열
  
  // 보조 조커 (선택적이지만 시너지 좋음)
  synergyJokers: string[]; // 조커 ID 배열
  
  // 빌드 설명
  buildStrategy: string;
  buildStrategyKorean: string;
  
  // 게임플레이 워크플로우
  gameplayFlow: {
    early: string;      // 초반 전략
    mid: string;        // 중반 전략
    late: string;       // 후반 전략
  };
  
  // 주사위 게임 적용 방법
  diceGameAdaptation: {
    applicable: boolean;
    adaptationNotes: string;
    adaptationNotesKorean: string;
  };
  
  // 예상 데미지 (참고용)
  expectedDamage?: {
    early: string;
    mid: string;
    late: string;
  };
  
  // 난이도
  difficulty: 'easy' | 'medium' | 'hard' | 'expert';
  
  // 메타 정보
  source: 'balatro';
  notes?: string;
}

/**
 * 발라트로 빌드 데이터베이스
 */
export const balatroBuilds: BalatroBuild[] = [
  // ============================================
  // 슈트 기반 빌드 (Suit-Based Builds)
  // ============================================
  
  {
    id: 'flush_build',
    name: 'Flush Build',
    nameKorean: '플러시 빌드',
    description: '특정 슈트에 집중하여 Flush 족보를 자주 내는 빌드',
    descriptionKorean: '특정 슈트에 집중하여 Flush 족보를 자주 내는 빌드',
    category: 'suit_based',
    tier: 'A',
    coreJokers: [
      'greedy_joker',      // ♦ 슈트마다 +3 Mult
      'lusty_joker',       // ♥ 슈트마다 +3 Mult
      'wrathful_joker',    // ♠ 슈트마다 +3 Mult
      'gluttonous_joker',  // ♣ 슈트마다 +3 Mult
      'droll_joker',        // Flush +10 Mult
      'canio',              // Flush ×2 Mult
    ],
    synergyJokers: [
      'four_fingers',       // Flush를 4장으로 만들 수 있음
      'rough_gem',         // ♦ 슈트마다 +$1
      'bloodstone',        // ♥ 슈트마다 ×1.5 Mult (50% 확률)
      'arrowhead',         // ♠ 슈트마다 +50 Chips
      'onyx_agate',        // ♣ 슈트마다 +7 Mult
    ],
    buildStrategy: 'Focus on one suit, use Planet cards to strengthen Flush, combine with suit-specific jokers',
    buildStrategyKorean: '한 슈트에 집중하고, 행성 카드로 Flush를 강화하며, 슈트별 조커와 조합',
    gameplayFlow: {
      early: 'Collect suit-specific jokers (Greedy, Lusty, Wrathful, Gluttonous). Use Tarot cards to convert dice to target suit.',
      mid: 'Add Flush-boosting jokers (Droll, Canio). Use Planet cards to upgrade Flush hand type.',
      late: 'Optimize with Four Fingers for easier Flush, add suit-specific rare jokers (Rough Gem, Bloodstone, Arrowhead, Onyx Agate).',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Use Dice Enchant to set all dice faces to same suit. Focus on getting 5 dice of same suit for Flush.',
      adaptationNotesKorean: '주사위 인챈트로 모든 주사위 면을 같은 슈트로 설정. 5개 주사위가 같은 슈트가 되도록 집중',
    },
    expectedDamage: {
      early: '50-100',
      mid: '200-500',
      late: '1000+',
    },
    difficulty: 'medium',
    source: 'balatro',
  },

  // ============================================
  // 족보 기반 빌드 (Hand Type Builds)
  // ============================================
  
  {
    id: 'pair_build',
    name: 'Pair Build',
    nameKorean: '페어 빌드',
    description: 'Pair 족보에 집중하는 초반 친화적 빌드',
    descriptionKorean: 'Pair 족보에 집중하는 초반 친화적 빌드',
    category: 'hand_type',
    tier: 'B',
    coreJokers: [
      'jolly_joker',        // Pair +8 Mult
      'sly_joker',          // Pair +50 Chips
    ],
    synergyJokers: [
      'mad_joker',          // Two Pair +10 Mult
      'zany_joker',         // Triple +12 Mult
      'photograph',         // 첫 번째 카드 ×2 Mult
    ],
    buildStrategy: 'Focus on making Pairs consistently. Upgrade Pair hand type with Planet cards.',
    buildStrategyKorean: '일관되게 Pair를 만드는 것에 집중. 행성 카드로 Pair 족보 강화',
    gameplayFlow: {
      early: 'Get Jolly Joker and Sly Joker. Focus on making Pairs every hand.',
      mid: 'Add Mad Joker for Two Pair synergy. Upgrade Pair hand type with Mercury planet card.',
      late: 'Add Photograph for first card bonus. Consider transitioning to Two Pair or Triple build.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Lock two dice with same value. Use rerolls to find pairs.',
      adaptationNotesKorean: '같은 값의 주사위 2개를 잠금. 리롤로 페어 찾기',
    },
    expectedDamage: {
      early: '30-80',
      mid: '100-300',
      late: '500-800',
    },
    difficulty: 'easy',
    source: 'balatro',
  },

  {
    id: 'straight_build',
    name: 'Straight Build',
    nameKorean: '스트레이트 빌드',
    description: 'Straight 족보에 집중하는 빌드',
    descriptionKorean: 'Straight 족보에 집중하는 빌드',
    category: 'hand_type',
    tier: 'A',
    coreJokers: [
      'crazy_joker',        // Straight +12 Mult
      'wily_joker',         // Triple +100 Chips (Straight에 포함)
      'shortcut',           // Straight를 간격으로 만들 수 있음
      'four_fingers',       // Straight를 4장으로 만들 수 있음
    ],
    synergyJokers: [
      'hack',               // 2,3,4,5 재발동
      'acrobat',            // 마지막 핸드 ×3 Mult
    ],
    buildStrategy: 'Use Shortcut and Four Fingers to make Straights easier. Combine with value-specific jokers.',
    buildStrategyKorean: 'Shortcut과 Four Fingers로 Straight를 쉽게 만들기. 값별 조커와 조합',
    gameplayFlow: {
      early: 'Get Crazy Joker. Use Tarot cards to arrange dice values for Straights.',
      mid: 'Add Shortcut and Four Fingers for easier Straight formation. Upgrade Straight hand type.',
      late: 'Add Hack for retrigger on low values. Use Acrobat for final hand bonus.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Arrange dice values in sequence (1-2-3-4-5 or 2-3-4-5-6). Use rerolls to complete sequences.',
      adaptationNotesKorean: '주사위 값을 순서대로 배열 (1-2-3-4-5 또는 2-3-4-5-6). 리롤로 시퀀스 완성',
    },
    expectedDamage: {
      early: '80-150',
      mid: '300-600',
      late: '1000-2000',
    },
    difficulty: 'medium',
    source: 'balatro',
  },

  // ============================================
  // 성장형 빌드 (Scaling Builds)
  // ============================================
  
  {
    id: 'vampire_midas_build',
    name: 'Vampire + Midas Build',
    nameKorean: '뱀파이어 + 미다스 빌드',
    description: '매 핸드마다 영구적으로 강해지는 성장형 빌드',
    descriptionKorean: '매 핸드마다 영구적으로 강해지는 성장형 빌드',
    category: 'scaling',
    tier: 'S',
    coreJokers: [
      'vampire',           // 강화된 카드마다 ×0.1 Mult 영구 증가
      'midas_mask',        // 모든 페이스 카드를 골드 카드로 변환
    ],
    synergyJokers: [
      'hologram',          // 덱에 카드 추가할 때마다 ×0.25 Mult 증가
      'dna',               // 첫 핸드에 1장만 내면 덱에 영구 추가
      'campfire',          // 스테이지마다 ×0.5 Mult 증가
    ],
    buildStrategy: 'Use Midas Mask to create Gold cards, then Vampire consumes them for permanent Mult growth.',
    buildStrategyKorean: 'Midas Mask로 골드 카드를 만들고, Vampire가 이를 소비하여 영구 Mult 증가',
    gameplayFlow: {
      early: 'Get Midas Mask first. Start converting face cards to Gold cards.',
      mid: 'Add Vampire. Each Gold card played gives permanent ×0.1 Mult. Add DNA for deck growth.',
      late: 'Add Hologram for additional scaling. Use Campfire for stage-based growth.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Use Dice Enchant to create "Gold" dice (special marking). Each Gold dice played increases permanent Mult.',
      adaptationNotesKorean: '주사위 인챈트로 "골드" 주사위 생성 (특별 표시). 골드 주사위를 낼 때마다 영구 Mult 증가',
    },
    expectedDamage: {
      early: '50-100',
      mid: '300-800',
      late: '5000+',
    },
    difficulty: 'hard',
    source: 'balatro',
  },

  {
    id: 'campfire_scaling_build',
    name: 'Campfire Scaling Build',
    nameKorean: '캠프파이어 성장 빌드',
    description: '스테이지마다 강해지는 성장형 빌드',
    descriptionKorean: '스테이지마다 강해지는 성장형 빌드',
    category: 'scaling',
    tier: 'A',
    coreJokers: [
      'campfire',          // 스테이지마다 ×0.5 Mult 증가
      'hiker',             // 리롤마다 ×0.5 Mult 증가
    ],
    synergyJokers: [
      'green_joker',       // 핸드마다 ×1 Mult 증가
      'ramen',             // ×2 Mult, 리롤마다 ×0.01 Mult 감소
    ],
    buildStrategy: 'Survive early game, then scale infinitely through stage clears and rerolls.',
    buildStrategyKorean: '초반 생존 후 스테이지 클리어와 리롤로 무한 성장',
    gameplayFlow: {
      early: 'Get Campfire. Focus on survival and clearing stages.',
      mid: 'Add Hiker for reroll scaling. Use rerolls strategically to maximize growth.',
      late: 'Add Green Joker for hand-based scaling. Optimize reroll usage.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Each stage clear increases Mult. Each reroll also increases Mult. Focus on survival early.',
      adaptationNotesKorean: '스테이지 클리어마다 Mult 증가. 리롤마다도 Mult 증가. 초반에는 생존에 집중',
    },
    expectedDamage: {
      early: '50-100',
      mid: '200-500',
      late: '2000-5000',
    },
    difficulty: 'medium',
    source: 'balatro',
  },

  // ============================================
  // 복제 빌드 (Copy Builds)
  // ============================================
  
  {
    id: 'blueprint_brainstorm_build',
    name: 'Blueprint + Brainstorm Build',
    nameKorean: '청사진 + 브레인스토밍 빌드',
    description: '강력한 조커를 복제하여 시너지를 극대화하는 빌드',
    descriptionKorean: '강력한 조커를 복제하여 시너지를 극대화하는 빌드',
    category: 'copy',
    tier: 'S+',
    coreJokers: [
      'blueprint',         // 오른쪽 조커 복사
      'brainstorm',        // 왼쪽 조커 복사
    ],
    synergyJokers: [
      'triboulet',         // 모든 카드 재발동
      'baron',             // 킹마다 ×1.5 Mult
      'mime',              // 잠긴 카드 재발동
    ],
    buildStrategy: 'Place powerful joker in middle, then Blueprint and Brainstorm copy it. Creates exponential scaling.',
    buildStrategyKorean: '강력한 조커를 중앙에 배치하고, Blueprint와 Brainstorm이 복사. 기하급수적 성장',
    gameplayFlow: {
      early: 'Find one powerful joker (Baron, Campfire, etc.).',
      mid: 'Get Blueprint or Brainstorm. Place powerful joker strategically.',
      late: 'Get both Blueprint and Brainstorm. Add Triboulet for retrigger synergy.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Position matters! Place powerful joker between Blueprint and Brainstorm for maximum effect.',
      adaptationNotesKorean: '위치가 중요! 강력한 조커를 Blueprint와 Brainstorm 사이에 배치하여 효과 극대화',
    },
    expectedDamage: {
      early: '100-200',
      mid: '500-1500',
      late: '10000+',
    },
    difficulty: 'expert',
    source: 'balatro',
  },

  // ============================================
  // 재발동 빌드 (Retrigger Builds)
  // ============================================
  
  {
    id: 'triboulet_retrigger_build',
    name: 'Triboulet Retrigger Build',
    nameKorean: '트리부레 재발동 빌드',
    description: '모든 효과를 두 번 발동시키는 재발동 빌드',
    descriptionKorean: '모든 효과를 두 번 발동시키는 재발동 빌드',
    category: 'retrigger',
    tier: 'S+',
    coreJokers: [
      'triboulet',         // 모든 플레이한 카드 재발동
      'mime',              // 잠긴 카드 재발동
    ],
    synergyJokers: [
      'hack',              // 2,3,4,5 재발동
      'hanging_chad',      // 첫 번째 카드 2번 더 재발동
      'seltzer',           // 다음 10핸드 재발동
      'sock_and_buskin',   // 페이스 카드 재발동
    ],
    buildStrategy: 'Combine multiple retrigger effects for exponential damage multiplication.',
    buildStrategyKorean: '여러 재발동 효과를 조합하여 기하급수적 데미지 증가',
    gameplayFlow: {
      early: 'Get Mime or Hack for basic retrigger.',
      mid: 'Add Triboulet for full retrigger. Combine with value-specific jokers.',
      late: 'Add multiple retrigger jokers. Stack effects for maximum damage.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Retrigger means "apply effect twice". With Triboulet, all effects are doubled.',
      adaptationNotesKorean: '재발동은 "효과를 두 번 적용"을 의미. Triboulet으로 모든 효과가 2배',
    },
    expectedDamage: {
      early: '100-300',
      mid: '1000-3000',
      late: '10000+',
    },
    difficulty: 'hard',
    source: 'balatro',
  },

  // ============================================
  // 덱 압축 빌드 (Deck Compression Builds)
  // ============================================
  
  {
    id: 'baron_king_build',
    name: 'Baron King Build',
    nameKorean: '바론 킹 빌드',
    description: '특정 값(킹)에 집중하여 덱을 압축하는 빌드',
    descriptionKorean: '특정 값(킹)에 집중하여 덱을 압축하는 빌드',
    category: 'deck_compression',
    tier: 'S',
    coreJokers: [
      'baron',             // 킹마다 ×1.5 Mult
      'mime',              // 잠긴 카드 재발동
    ],
    synergyJokers: [
      'photograph',        // 첫 번째 페이스 카드 ×2 Mult
      'pareidolia',        // 모든 카드를 페이스 카드로 간주
      'sock_and_buskin',   // 페이스 카드 재발동
    ],
    buildStrategy: 'Compress deck to only Kings. Use Baron for ×1.5 Mult per King held. Mime retriggers.',
    buildStrategyKorean: '덱을 킹만 남기도록 압축. Baron으로 킹마다 ×1.5 Mult. Mime으로 재발동',
    gameplayFlow: {
      early: 'Get Baron. Start collecting Kings.',
      mid: 'Use Tarot cards to convert all dice to Kings. Add Mime for retrigger.',
      late: 'Add Photograph and Pareidolia. Optimize deck to only Kings.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Use Dice Enchant to set all dice faces to value 6 (King equivalent). Lock all dice for Baron bonus.',
      adaptationNotesKorean: '주사위 인챈트로 모든 주사위 면을 값 6(킹 상당)으로 설정. Baron 보너스를 위해 모든 주사위 잠금',
    },
    expectedDamage: {
      early: '100-200',
      mid: '500-2000',
      late: '5000-20000',
    },
    difficulty: 'hard',
    source: 'balatro',
  },

  // ============================================
  // 경제 빌드 (Economy Builds)
  // ============================================
  
  {
    id: 'economy_build',
    name: 'Economy Build',
    nameKorean: '경제 빌드',
    description: '골드를 많이 모아서 더 많은 조커를 구매하는 빌드',
    descriptionKorean: '골드를 많이 모아서 더 많은 조커를 구매하는 빌드',
    category: 'economy',
    tier: 'B',
    coreJokers: [
      'golden_ticket',     // 골드 카드마다 +$4
      'business_card',     // 페이스 카드마다 +$2 (50% 확률)
      'rough_gem',         // ♦ 슈트마다 +$1
    ],
    synergyJokers: [
      'rocket',            // 라운드마다 +$1, 보스마다 +$2 증가
      'cloud_9',           // 덱의 9마다 +$1
      'credit_card',       // -$20까지 빚 가능
    ],
    buildStrategy: 'Generate gold early to buy more jokers. Transition to damage build mid-game.',
    buildStrategyKorean: '초반에 골드를 많이 생성하여 더 많은 조커 구매. 중반에 데미지 빌드로 전환',
    gameplayFlow: {
      early: 'Get economy jokers (Golden Ticket, Business Card). Generate gold every hand.',
      mid: 'Use gold to buy powerful jokers. Start transitioning to damage build.',
      late: 'Sell economy jokers for damage jokers. Optimize final build.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Each hand generates gold. Use gold to buy jokers in shop. Economy builds are transitional.',
      adaptationNotesKorean: '매 핸드마다 골드 생성. 상점에서 골드로 조커 구매. 경제 빌드는 전환형',
    },
    expectedDamage: {
      early: '30-60',
      mid: '100-300',
      late: '500-1500',
    },
    difficulty: 'easy',
    source: 'balatro',
  },

  // ============================================
  // 특정 값 활용 빌드 (Value-Specific Builds)
  // ============================================
  
  {
    id: 'wee_joker_build',
    name: 'Wee Joker Build',
    nameKorean: '위 조커 빌드',
    description: '낮은 값(2)을 활용하는 빌드',
    descriptionKorean: '낮은 값(2)을 활용하는 빌드',
    category: 'value_specific',
    tier: 'A',
    coreJokers: [
      'wee_joker',         // 2마다 +8 Chips 영구 증가
      'hack',              // 2,3,4,5 재발동
    ],
    synergyJokers: [
      'odd_todd',          // 홀수 값마다 +31 Chips
      'even_steven',       // 짝수 값마다 +4 Mult
    ],
    buildStrategy: 'Play many 2s to scale Wee Joker. Use Hack to retrigger low values.',
    buildStrategyKorean: '많은 2를 내서 Wee Joker 성장. Hack으로 낮은 값 재발동',
    gameplayFlow: {
      early: 'Get Wee Joker. Start playing 2s to scale Chips.',
      mid: 'Add Hack for retrigger on 2s. Use Tarot cards to create more 2s.',
      late: 'Add Odd Todd and Even Steven for value-specific bonuses.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Focus on getting value 2 dice. Each 2 played increases permanent Chips. Use Hack to double effect.',
      adaptationNotesKorean: '값 2 주사위 획득에 집중. 2를 낼 때마다 영구 Chips 증가. Hack으로 효과 2배',
    },
    expectedDamage: {
      early: '50-100',
      mid: '300-800',
      late: '2000-5000',
    },
    difficulty: 'medium',
    source: 'balatro',
  },

  // ============================================
  // 하이브리드 빌드 (Hybrid Builds)
  // ============================================
  
  {
    id: 'hybrid_flush_straight',
    name: 'Hybrid Flush + Straight Build',
    nameKorean: '하이브리드 플러시 + 스트레이트 빌드',
    description: 'Straight Flush를 목표로 하는 하이브리드 빌드',
    descriptionKorean: 'Straight Flush를 목표로 하는 하이브리드 빌드',
    category: 'hybrid',
    tier: 'S',
    coreJokers: [
      'droll_joker',       // Flush +10 Mult
      'crazy_joker',       // Straight +12 Mult
      'canio',             // Flush ×2 Mult
      'shortcut',          // Straight를 간격으로 만들 수 있음
      'four_fingers',      // Straight/Flush를 4장으로 만들 수 있음
    ],
    synergyJokers: [
      'triboulet',         // 재발동
      'mime',              // 잠긴 카드 재발동
    ],
    buildStrategy: 'Aim for Straight Flush (highest multiplier). Use both Flush and Straight jokers.',
    buildStrategyKorean: 'Straight Flush(최고 배수)를 목표. Flush와 Straight 조커 모두 사용',
    gameplayFlow: {
      early: 'Get Flush or Straight jokers. Start building towards one type.',
      mid: 'Add both Flush and Straight jokers. Use Shortcut and Four Fingers for easier formation.',
      late: 'Aim for Straight Flush. Add retrigger jokers for maximum damage.',
    },
    diceGameAdaptation: {
      applicable: true,
      adaptationNotes: 'Get 5 dice in sequence AND same suit. Very difficult but highest multiplier.',
      adaptationNotesKorean: '5개 주사위가 순서대로이면서 같은 슈트. 매우 어렵지만 최고 배수',
    },
    expectedDamage: {
      early: '100-200',
      mid: '500-1500',
      late: '5000-20000',
    },
    difficulty: 'expert',
    source: 'balatro',
  },
];

/**
 * 빌드 검색 및 필터링 헬퍼 함수
 */

export function getBuildById(id: string): BalatroBuild | undefined {
  return balatroBuilds.find(build => build.id === id);
}

export function getBuildsByCategory(category: BuildCategory): BalatroBuild[] {
  return balatroBuilds.filter(build => build.category === category);
}

export function getBuildsByTier(tier: BuildTier): BalatroBuild[] {
  return balatroBuilds.filter(build => build.tier === tier);
}

export function getBuildsByDifficulty(difficulty: BalatroBuild['difficulty']): BalatroBuild[] {
  return balatroBuilds.filter(build => build.difficulty === difficulty);
}

export function getBuildsByJoker(jokerId: string): BalatroBuild[] {
  return balatroBuilds.filter(build => 
    build.coreJokers.includes(jokerId) || 
    build.synergyJokers.includes(jokerId)
  );
}

export function getRecommendedBuilds(
  availableJokers: string[],
  stage: number
): BalatroBuild[] {
  // 초반(1-3): 쉬운 빌드 추천
  // 중반(4-6): 중간 빌드 추천
  // 후반(7+): 강력한 빌드 추천
  
  const difficultyFilter: BalatroBuild['difficulty'][] = 
    stage <= 3 ? ['easy', 'medium'] :
    stage <= 6 ? ['medium', 'hard'] :
    ['hard', 'expert'];
  
  return balatroBuilds
    .filter(build => difficultyFilter.includes(build.difficulty))
    .filter(build => {
      // 사용 가능한 조커로 빌드 구성 가능한지 확인
      const hasCoreJokers = build.coreJokers.some(jokerId => 
        availableJokers.includes(jokerId)
      );
      return hasCoreJokers;
    })
    .sort((a, b) => {
      // 사용 가능한 핵심 조커 수로 정렬
      const aCount = build.coreJokers.filter(id => availableJokers.includes(id)).length;
      const bCount = build.coreJokers.filter(id => availableJokers.includes(id)).length;
      return bCount - aCount;
    });
}

/**
 * 빌드 통계
 */
export const buildStats = {
  totalBuilds: balatroBuilds.length,
  byCategory: {
    suit_based: balatroBuilds.filter(b => b.category === 'suit_based').length,
    hand_type: balatroBuilds.filter(b => b.category === 'hand_type').length,
    scaling: balatroBuilds.filter(b => b.category === 'scaling').length,
    copy: balatroBuilds.filter(b => b.category === 'copy').length,
    retrigger: balatroBuilds.filter(b => b.category === 'retrigger').length,
    deck_compression: balatroBuilds.filter(b => b.category === 'deck_compression').length,
    economy: balatroBuilds.filter(b => b.category === 'economy').length,
    value_specific: balatroBuilds.filter(b => b.category === 'value_specific').length,
    hybrid: balatroBuilds.filter(b => b.category === 'hybrid').length,
  },
  byTier: {
    'S+': balatroBuilds.filter(b => b.tier === 'S+').length,
    'S': balatroBuilds.filter(b => b.tier === 'S').length,
    'A': balatroBuilds.filter(b => b.tier === 'A').length,
    'B': balatroBuilds.filter(b => b.tier === 'B').length,
    'C': balatroBuilds.filter(b => b.tier === 'C').length,
  },
  byDifficulty: {
    easy: balatroBuilds.filter(b => b.difficulty === 'easy').length,
    medium: balatroBuilds.filter(b => b.difficulty === 'medium').length,
    hard: balatroBuilds.filter(b => b.difficulty === 'hard').length,
    expert: balatroBuilds.filter(b => b.difficulty === 'expert').length,
  },
};



