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
  
  // 주사위 상태 (JSON 배열)
  dices: jsonb("dices").notNull().default(sql`'[]'::jsonb`),
  
  // 인벤토리 (JSON 배열)
  jokers: jsonb("jokers").notNull().default(sql`'[]'::jsonb`),
  consumables: jsonb("consumables").notNull().default(sql`'[]'::jsonb`),
  vouchers: jsonb("vouchers").notNull().default(sql`'[]'::jsonb`),
  
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
