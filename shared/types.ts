/**
 * 게임 관련 타입 정의
 */

import type { Dice, Consumable } from './schema';
import type { BalatroPlanet } from '../benchmark/balatro-schemas';

// 족보 업그레이드 타입
export interface HandUpgrade {
  handName: string; // 족보 이름 (예: "Pair", "Triple")
  multiplierBonus: number; // 추가되는 multiplier
  planetUsed: string; // 사용된 행성 카드 ID
}

// 주사위 인챈트 타입
export type EnchantTarget = 'top' | 'all'; // 윗면만 또는 모든 면
export type EnchantType = 'value' | 'suit' | 'both'; // 값 변경, 슈트 변경, 둘 다

export interface DiceEnchantment {
  diceId: number;
  target: EnchantTarget;
  type: EnchantType;
  newValue?: number; // 1-6
  newSuit?: 'None' | '♠' | '♦' | '♥' | '♣';
}

// 행성 카드 타입 (간소화)
export interface PlanetCard {
  id: string;
  name: string;
  pokerHand: string; // 해당하는 족보 이름
  addition: string; // 추가 효과 설명
}

// 타로 카드 타입 (간소화)
export interface TarotCard {
  id: string;
  name: string;
  description: string;
  effect: 'enhance' | 'transform' | 'create' | 'other';
}

