import { z } from 'zod';
import { diceSchema, jokerSchema, consumableSchema, voucherSchema } from '@shared/schema';

export const rollDiceSchema = z.object({
  lockedDices: z.array(z.object({
    id: z.number(),
    value: z.number().min(1).max(6),
  })).optional(),
});

export const submitHandSchema = z.object({
  lockedDices: z.array(diceSchema), // 잠긴 주사위 배열 (순차 발동용)
  handName: z.string(), // 선택된 족보 이름
});

export const nextStageSchema = z.object({
  stageChoice: z.enum(['easy', 'medium', 'hard', 'boss']),
});

export const shopBuySchema = z.object({
  itemType: z.enum(['joker', 'consumable', 'voucher']),
  item: z.union([jokerSchema, consumableSchema, voucherSchema]),
  cost: z.number().min(0),
});

// 족보 업그레이드 스키마
export const upgradeHandSchema = z.object({
  planetCardId: z.string(),
  handName: z.string(), // 업그레이드할 족보 이름
});

// 주사위 인챈트 스키마
export const enchantDiceSchema = z.object({
  consumableId: z.string(),
  diceId: z.number().optional(), // 선택된 주사위 ID (top 모드일 때 필수)
  target: z.enum(['top', 'all']), // 윗면만 또는 모든 면
  enchantType: z.enum(['value', 'suit', 'both']), // 변경 타입
  newValue: z.number().min(1).max(6).optional(), // 새 값 (value 또는 both일 때)
  newSuit: z.enum(['None', '♠', '♦', '♥', '♣']).optional(), // 새 슈트 (suit 또는 both일 때)
});

// 주사위 덱 동기화 스키마
export const syncDiceDeckSchema = z.object({
  dices: z.array(z.object({
    id: z.number(),
    value: z.number().min(1).max(6),
    suit: z.enum(['None', '♠', '♦', '♥', '♣']),
  })),
});