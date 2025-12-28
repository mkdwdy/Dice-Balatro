import { z } from 'zod';

/**
 * 발라트로 벤치마킹 데이터 스키마
 * 모든 카드 타입의 공통 스키마 정의
 */

// 공통 필드
export const baseItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  source: z.literal('balatro'),
});

// 조커 스키마
export const jokerRaritySchema = z.enum(['common', 'uncommon', 'rare', 'legendary']);

export const balatroJokerSchema = baseItemSchema.extend({
  nr: z.number().optional(),
  rarity: jokerRaritySchema,
  effect: z.string(),
  baseCost: z.number().optional(),
  unlockRequirement: z.string().optional(),
  type: z.string().optional(),
  activationType: z.string().optional(),
  diceGameApplicable: z.boolean().default(true),
  diceGameNotes: z.string().optional(),
});

// 타로 카드 스키마
export const balatroTarotSchema = baseItemSchema.extend({
  // 추가 필드가 필요하면 여기에
});

// 행성 카드 스키마
export const balatroPlanetSchema = baseItemSchema.extend({
  description: z.string().optional(), // addition을 description으로 사용 가능
  addition: z.string().optional(),
  pokerHand: z.string().optional(),
  handBaseScore: z.string().optional(),
  type: z.string().optional(),
});

// 스펙트럴 카드 스키마
export const balatroSpectralSchema = baseItemSchema.extend({
  effect: z.string(),
});

// 바우처 스키마
export const balatroVoucherSchema = baseItemSchema.extend({
  effect: z.string(),
  isUpgraded: z.boolean().default(false),
  upgradedName: z.string().optional(),
  upgradedEffect: z.string().optional(),
  baseName: z.string().optional(),
  unlockCondition: z.string().optional(),
  notes: z.string().optional(),
});

// 부스터 팩 스키마
export const balatroBoosterSchema = baseItemSchema.extend({
  packName: z.string(),
  cost: z.number(),
  size: z.string(),
  effect: z.string(),
});

// 타입 정의
export type BalatroJoker = z.infer<typeof balatroJokerSchema>;
export type BalatroTarot = z.infer<typeof balatroTarotSchema>;
export type BalatroPlanet = z.infer<typeof balatroPlanetSchema>;
export type BalatroSpectral = z.infer<typeof balatroSpectralSchema>;
export type BalatroVoucher = z.infer<typeof balatroVoucherSchema>;
export type BalatroBooster = z.infer<typeof balatroBoosterSchema>;

