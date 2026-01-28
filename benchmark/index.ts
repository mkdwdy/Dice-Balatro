/**
 * 발라트로 벤치마킹 데이터베이스 인덱스
 * 모든 카드와 부스터 팩을 한 곳에서 접근
 */

// 조커
export * from './balatro-jokers-db';
export type { BalatroJoker } from './balatro-schemas';

// 타로 카드
export * from './balatro-tarots-db';
export type { BalatroTarot } from './balatro-schemas';

// 행성 카드
export * from './balatro-planets-db';
export type { BalatroPlanet } from './balatro-schemas';

// 스펙트럴 카드
export * from './balatro-spectrals-db';
export type { BalatroSpectral } from './balatro-schemas';

// 바우처
export * from './balatro-vouchers-db';
export type { BalatroVoucher } from './balatro-schemas';

// 부스터 팩
export * from './balatro-boosters-db';
export type { BalatroBooster } from './balatro-schemas';

// 빌드
export * from './balatro-builds-db';
export type { BalatroBuild, BuildCategory, BuildTier } from './balatro-builds-db';

// 통계
export const benchmarkStats = {
  jokers: 150,
  tarots: 22,
  planets: 12,
  spectrals: 18,
  vouchers: 32,
  boosters: 17,
  builds: 10,
  total: 261,
};
