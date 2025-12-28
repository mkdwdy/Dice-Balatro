# 발라트로 벤치마킹 데이터베이스

이 폴더에는 발라트로 게임의 모든 요소들을 벤치마킹한 데이터가 포함되어 있습니다.

## 📊 데이터베이스 통계

- **Jokers (조커)**: 150개
- **Tarot Cards (타로 카드)**: 22개
- **Planet Cards (행성 카드)**: 12개
- **Spectral Cards (스펙트럴 카드)**: 18개
- **Vouchers (바우처)**: 32개
- **Booster Packs (부스터 팩)**: 17개
- **총합**: 251개 항목

## 📁 파일 구조

### 스키마 파일
- `balatro-schemas.ts`: 모든 카드 타입의 TypeScript 스키마 정의

### 데이터베이스 파일
- `balatro-jokers-db.ts`: 조커 카드 데이터베이스 (150개)
- `balatro-tarots-db.ts`: 타로 카드 데이터베이스 (22개)
- `balatro-planets-db.ts`: 행성 카드 데이터베이스 (12개)
- `balatro-spectrals-db.ts`: 스펙트럴 카드 데이터베이스 (18개)
- `balatro-vouchers-db.ts`: 바우처 데이터베이스 (32개)
- `balatro-boosters-db.ts`: 부스터 팩 데이터베이스 (17개)

### 인덱스 파일
- `index.ts`: 모든 데이터베이스를 한 곳에서 접근할 수 있는 인덱스

### 원본 데이터
- `BalatroDatabase.xlsx`: 원본 엑셀 파일
- `converted-data.json`: 변환된 JSON 데이터 (검증용)

## 🚀 사용 방법

### 기본 사용

```typescript
import {
  balatroJokers,
  balatroTarots,
  balatroPlanets,
  balatroSpectrals,
  balatroVouchers,
  balatroBoosters,
  benchmarkStats,
} from './benchmark';

// 통계 확인
console.log(benchmarkStats);
// {
//   jokers: 150,
//   tarots: 22,
//   planets: 12,
//   spectrals: 18,
//   vouchers: 32,
//   boosters: 17,
//   total: 251
// }
```

### 조커 검색

```typescript
import {
  getJokerById,
  getJokersByRarity,
  getJokersByType,
  searchJokers,
} from './benchmark';

// ID로 조커 찾기
const joker = getJokerById('blueprint');

// 희귀도로 필터링
const legendaryJokers = getJokersByRarity('legendary');

// 타입으로 필터링
const damageJokers = getJokersByType('+m');

// 검색
const results = searchJokers('multiplier');
```

### 행성 카드 검색

```typescript
import {
  getPlanetsByPokerHand,
  getPlanetsByType,
} from './benchmark';

// 포커 핸드로 필터링
const pairPlanets = getPlanetsByPokerHand('Pair');

// 타입으로 필터링
const planetCards = getPlanetsByType('Planet');
```

### 바우처 검색

```typescript
import {
  getBaseVouchers,
  getUpgradedVouchers,
  getVoucherPair,
} from './benchmark';

// 기본 바우처만
const baseVouchers = getBaseVouchers();

// 업그레이드된 바우처만
const upgradedVouchers = getUpgradedVouchers();

// 기본 + 업그레이드 쌍 찾기
const { base, upgraded } = getVoucherPair('Overstock');
```

### 부스터 팩 검색

```typescript
import {
  getBoostersByPackName,
  getBoostersBySize,
  getBoostersByCost,
} from './benchmark';

// 패키지 이름으로 필터링
const standardPacks = getBoostersByPackName('Standard');

// 크기로 필터링
const jumboPacks = getBoostersBySize('jumbo');

// 가격으로 필터링
const cheapPacks = getBoostersByCost(5); // $5 이하
```

## 🎯 사용 목적

1. **벤치마킹**: 발라트로의 밸런싱과 디자인 패턴 학습
2. **참고 자료**: 새로운 조커/카드 디자인 시 참고
3. **밸런싱 검증**: 효과 수치 비교 및 검증
4. **구현 가이드**: 주사위 게임에 적용 가능한 효과 파악

## 📝 데이터 출처

- **원본**: Balatro Wiki (https://balatrowiki.org)
- **엑셀 파일**: `BalatroDatabase.xlsx`
- **최종 업데이트**: 2025-12-27

## 🔄 업데이트 방법

1. `BalatroDatabase.xlsx` 파일 업데이트
2. 변환 스크립트 실행:
   ```bash
   npx tsx benchmark/convert-all-data.ts
   npx tsx benchmark/generate-typescript-db.ts
   ```
3. 타입 체크:
   ```bash
   npm run check
   ```

## 💡 개발 중 활용 예시

### 조커 효과 분석

```typescript
import { balatroJokers } from './benchmark';

// 모든 조커의 평균 가격 계산
const avgCost = balatroJokers
  .filter(j => j.baseCost)
  .reduce((sum, j) => sum + (j.baseCost || 0), 0) / 
  balatroJokers.filter(j => j.baseCost).length;

// 희귀도별 분포
const rarityDistribution = balatroJokers.reduce((acc, j) => {
  acc[j.rarity] = (acc[j.rarity] || 0) + 1;
  return acc;
}, {} as Record<string, number>);
```

### 주사위 게임 적용 가능성 분석

```typescript
import { balatroJokers } from './benchmark';

// 주사위 게임에 적용 가능한 조커
const applicableJokers = balatroJokers.filter(j => 
  j.diceGameApplicable && 
  j.effect.toLowerCase().includes('mult') ||
  j.effect.toLowerCase().includes('chips')
);
```

## 📚 관련 문서

- `docs/DESIGN_COLLABORATION.md`: 게임 디자인 협업 가이드
- `docs/EXCEL_FORMAT_GUIDE.md`: 엑셀 파일 형식 가이드
