import { z } from 'zod';

/**
 * 발라트로 조커 카드 벤치마킹 스키마
 * 주사위 게임에 맞게 확장 가능한 구조
 */

// 조커 등급
export const jokerRaritySchema = z.enum([
  'common',      // 일반
  'uncommon',    // 희귀
  'rare',        // 레어
  'legendary',   // 전설
  'special',     // 특수
]);

// 효과 타입 분류
export const effectTypeSchema = z.enum([
  'damage_multiplier',      // 데미지 배수
  'hand_type_boost',        // 손패 타입 보너스
  'dice_value_boost',       // 주사위 값 보너스
  'suit_boost',            // 슈트 보너스
  'reroll_effect',          // 리롤 관련
  'gold_economy',           // 골드 경제
  'combo_bonus',            // 콤보 보너스
  'conditional',            // 조건부 효과
  'utility',                // 유틸리티
  'synergy',                // 시너지
]);

// 발라트로 조커 카드 스키마
export const balatroJokerSchema = z.object({
  // 기본 정보
  id: z.string(),
  name: z.string(),
  nameKorean: z.string().optional(),
  description: z.string(),
  descriptionKorean: z.string().optional(),
  
  // 등급 및 희귀도
  rarity: jokerRaritySchema,
  tier: z.enum(['S+', 'S', 'A', 'B', 'C', 'D']).optional(),
  
  // 효과 정보
  effectType: effectTypeSchema,
  effect: z.string(), // 효과 설명
  effectKorean: z.string().optional(),
  
  // 게임 밸런싱
  baseCost: z.number().optional(), // 기본 가격
  sellValue: z.number().optional(), // 판매 가격
  
  // 효과 수치 (구현용)
  effectValues: z.record(z.union([z.number(), z.string(), z.boolean()])).optional(),
  
  // 조건부 효과
  conditions: z.array(z.string()).optional(), // 효과 발동 조건
  
  // 시너지 정보
  synergies: z.array(z.string()).optional(), // 다른 조커와의 시너지
  
  // 주사위 게임 적용 가능성
  diceGameApplicable: z.boolean().default(true),
  diceGameNotes: z.string().optional(), // 주사위 게임에 적용 시 참고사항
  
  // 메타 정보
  source: z.literal('balatro'),
  version: z.string().optional(), // 발라트로 버전
  notes: z.string().optional(), // 추가 메모
});

export type BalatroJoker = z.infer<typeof balatroJokerSchema>;
export type JokerRarity = z.infer<typeof jokerRaritySchema>;
export type EffectType = z.infer<typeof effectTypeSchema>;

