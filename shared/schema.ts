import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, jsonb, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// 게임 세션 테이블
export const gameSessions = pgTable("game_sessions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  
  // 플레이어 상태
  health: integer("health").notNull().default(100),
  maxHealth: integer("max_health").notNull().default(100),
  gold: integer("gold").notNull().default(0),
  score: integer("score").notNull().default(0),
  
  // 진행도
  currentStage: integer("current_stage").notNull().default(1), // 1, 2, 3, ...
  currentRound: integer("current_round").notNull().default(1), // 1, 2, 3 (블라인드 번호)
  
  // 게임 상태: 'combat', 'shop', 'stage_select', 'game_over', 'victory'
  gameState: text("game_state").notNull().default('combat'),
  
  // 전투 상태
  enemyHp: integer("enemy_hp").notNull().default(100),
  maxEnemyHp: integer("max_enemy_hp").notNull().default(100),
  enemyDamage: integer("enemy_damage").notNull().default(10),
  pendingGoldReward: integer("pending_gold_reward").notNull().default(0),
  rerollsLeft: integer("rerolls_left").notNull().default(3),
  
  // 주사위 상태 (JSON 배열) - 현재 손에 있는 주사위
  dices: jsonb("dices").notNull().default(sql`'[]'::jsonb`),
  
  // 주사위 덱 (JSON 배열) - 보유한 모든 주사위의 모든 면 정보
  diceDeck: jsonb("dice_deck").notNull().default(sql`'[]'::jsonb`),
  
  // 인벤토리 (JSON 배열)
  jokers: jsonb("jokers").notNull().default(sql`'[]'::jsonb`),
  consumables: jsonb("consumables").notNull().default(sql`'[]'::jsonb`),
  vouchers: jsonb("vouchers").notNull().default(sql`'[]'::jsonb`),
  
  // 족보 업그레이드 (행성 카드로 업그레이드된 족보의 multiplier 증가량)
  // 예: { "Pair": 1, "Triple": 2 } -> Pair는 +1, Triple은 +2 multiplier 증가
  handUpgrades: jsonb("hand_upgrades").notNull().default(sql`'{}'::jsonb`),
  
  // 타임스탬프
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Zod 스키마
export const insertGameSessionSchema = createInsertSchema(gameSessions).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const updateGameSessionSchema = insertGameSessionSchema.partial();

// 타입 정의
export type InsertGameSession = z.infer<typeof insertGameSessionSchema>;
export type UpdateGameSession = z.infer<typeof updateGameSessionSchema>;
export type GameSession = typeof gameSessions.$inferSelect;

// 주사위 타입
export const diceSchema = z.object({
  id: z.number(),
  value: z.number().min(1).max(6),
  suit: z.enum(['None', '♠', '♦', '♥', '♣']),
  locked: z.boolean(),
});

export type Dice = z.infer<typeof diceSchema>;

// 주사위 면 타입 (6면체 주사위의 각 면)
export const diceFaceSchema = z.object({
  value: z.number().min(1).max(6),
  suit: z.enum(['None', '♠', '♦', '♥', '♣']),
});

export type DiceFace = z.infer<typeof diceFaceSchema>;

// 주사위 덱의 주사위 타입 (모든 면 정보 포함)
export const deckDiceSchema = z.object({
  id: z.number(),
  faces: z.array(diceFaceSchema).length(6), // 6면체이므로 항상 6개
  currentTopFace: z.number().min(0).max(5), // 현재 윗면 인덱스
});

export type DeckDice = z.infer<typeof deckDiceSchema>;

// 조커 타입 (나중에 확장 가능)
export const jokerSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effect: z.string(),
});

export type Joker = z.infer<typeof jokerSchema>;

// 소모품 타입
export const consumableSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effect: z.string(),
});

export type Consumable = z.infer<typeof consumableSchema>;

// 바우처 타입
export const voucherSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string(),
  effect: z.string(),
});

export type Voucher = z.infer<typeof voucherSchema>;

// 타입 가드 함수들
export function isDiceArray(value: unknown): value is Dice[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => diceSchema.safeParse(item).success);
}

export function isJokerArray(value: unknown): value is Joker[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => jokerSchema.safeParse(item).success);
}

export function isConsumableArray(value: unknown): value is Consumable[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => consumableSchema.safeParse(item).success);
}

export function isVoucherArray(value: unknown): value is Voucher[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => voucherSchema.safeParse(item).success);
}

export function isDeckDiceArray(value: unknown): value is DeckDice[] {
  if (!Array.isArray(value)) return false;
  return value.every((item) => deckDiceSchema.safeParse(item).success);
}
