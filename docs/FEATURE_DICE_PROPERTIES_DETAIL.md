# 피쳐 상세: 주사위 속성 시스템

## 📋 개요

주사위는 **4가지 핵심 요소**로 구성되며, 각 요소가 주사위의 가치와 효과를 결정합니다.

---

## 🎲 주사위 속성 4요소

### 1. 배경색/타입 (Material Type)

주사위의 **배경색과 재질**을 결정하며, 특수 능력을 부여합니다.

| 타입 | 배경색 | 효과 | 가치 보너스 |
|------|--------|------|------------|
| Normal | 흰색 | 기본, 특수 효과 없음 | +0 |
| Glass | 투명/반투명 | Mult ×2, 파괴 확률 20% | +5 |
| Stone | 회색 돌 | Chips +50, 족보 미포함 | +3 |
| Steel | 은색 금속 | 파괴 불가, Chips +20 | +4 |
| Gold | 금색 | Mult +5, 골드 +$2 생성 | +8 |
| Wild | 무지개색 | 모든 슈트로 간주 | +6 |

### 2. Foil (Edition)

주사위 위에 씌워지는 **특수 코팅**으로, 추가 효과를 제공합니다.

| Foil | 시각적 효과 | 효과 | 가치 보너스 |
|------|------------|------|------------|
| 없음 | 기본 | 특수 효과 없음 | +0 |
| Foil | 반사 효과 | Chips +10% | +3 |
| Holographic | 무지개 빛 | Mult +10% | +5 |
| Polychrome | 색상 변화 | Mult ×1.5 | +8 |

### 3. 면의 숫자 (Face Values)

각 주사위는 **6개 면**을 가지며, 각 면의 값은 1-6입니다.

- **기본 구성**: 1, 2, 3, 4, 5, 6 (순차)
- **커스터마이징**: 인챈트로 특정 값으로 변경 가능
- **특수 구성**: 모든 면이 같은 값 (예: 모두 6) → 높은 가치

### 4. 면의 문양 (Face Suits)

각 면의 **슈트**를 결정하며, 족보 계산에 영향을 줍니다.

- **슈트 종류**: None, ♠ (Spade), ♦ (Diamond), ♥ (Heart), ♣ (Club)
- **기본 구성**: 주사위별로 고정 슈트 (예: 첫 번째 주사위는 ♠)
- **커스터마이징**: 인챈트로 슈트 변경 가능
- **특수 구성**: 모든 면이 같은 슈트 → Flush 빌드용

---

## 💰 주사위 가치 계산

```typescript
function calculateDiceValue(dice: DeckDice): number {
  let baseValue = 10; // 기본 주사위 가치
  
  // 1. 타입 보너스
  const typeBonus = {
    'normal': 0,
    'glass': 5,
    'stone': 3,
    'steel': 4,
    'gold': 8,
    'wild': 6,
  }[dice.materialType] || 0;
  
  // 2. Foil 보너스
  const foilBonus = {
    'none': 0,
    null: 0,
    'foil': 3,
    'holographic': 5,
    'polychrome': 8,
  }[dice.foil || 'none'] || 0;
  
  // 3. 면 구성 보너스
  const faceBonus = calculateFaceBonus(dice.faces);
  // 예: 모든 면이 같은 값 → +5
  // 예: 모든 면이 같은 슈트 → +3
  
  // 4. 특수 효과 보너스
  const specialBonus = calculateSpecialBonus(dice);
  
  return baseValue + typeBonus + foilBonus + faceBonus + specialBonus;
}
```

---

## 🎮 주사위 추가 시 속성 결정

### 조커 효과로 추가

#### "Extra Dice" 조커
```typescript
const rule: DiceGenerationRule = {
  defaultMaterialType: 'normal',
  defaultFoil: null,
  defaultSuit: getRandomSuit(), // 랜덤 슈트
  defaultFaces: createDefaultFaces(getRandomSuit()), // 기본 값 (1-6)
  randomizeSuit: true,
};
```

#### "Dice Collector" 조커
```typescript
const rule: DiceGenerationRule = {
  cloneFrom: getRandomDiceId(),
  cloneProperties: ['materialType', 'foil', 'faces'], // 모든 속성 복제
};
```

### 소모품으로 추가

#### "Dice Summon" 타로 카드
```typescript
const rule: DiceGenerationRule = {
  defaultMaterialType: 'normal',
  defaultFoil: null,
  defaultSuit: playerSelectedSuit || getRandomSuit(),
  defaultFaces: createDefaultFaces(playerSelectedSuit || getRandomSuit()),
  allowCustomization: true,
  customizationOptions: {
    suits: ['♠', '♦', '♥', '♣'], // 슈트 선택 가능
  },
};
```

#### "Premium Dice Pack" 소모품
```typescript
const rule: DiceGenerationRule = {
  defaultMaterialType: playerSelectedType || 'normal',
  defaultFoil: playerSelectedFoil || null,
  defaultSuit: playerSelectedSuit || getRandomSuit(),
  defaultFaces: playerCustomizedFaces || createDefaultFaces(playerSelectedSuit),
  allowCustomization: true,
  customizationOptions: {
    materialTypes: ['normal', 'glass', 'stone', 'steel', 'gold', 'wild'],
    foils: ['none', 'foil', 'holographic', 'polychrome'],
    suits: ['None', '♠', '♦', '♥', '♣'],
  },
};
```

### 상점 구매 시

#### 기본 주사위 ($5-10)
- 타입: Normal
- Foil: 없음
- 슈트: 랜덤 또는 선택
- 면 값: 기본 (1-6)

#### 고급 주사위 ($15-25)
- 타입: 선택 가능
- Foil: 선택 가능 (추가 비용)
- 슈트: 커스터마이징 가능
- 면 값: 커스터마이징 가능

#### 프리미엄 주사위 ($30+)
- 타입: 모든 타입 선택 가능
- Foil: 모든 Edition 선택 가능
- 슈트: 완전 커스터마이징
- 면 값: 완전 커스터마이징
- 특수 효과: 추가 능력 부여 가능

---

## 🔧 데이터 구조

```typescript
// 주사위 속성 완전 정의
export const deckDiceSchema = z.object({
  id: z.number(),
  
  // 면 정보 (6개)
  faces: z.array(z.object({
    value: z.number().min(1).max(6),
    suit: z.enum(['None', '♠', '♦', '♥', '♣']),
  })).length(6),
  
  currentTopFace: z.number().min(0).max(5),
  
  // 1. 배경색/타입
  materialType: z.enum(['normal', 'glass', 'stone', 'steel', 'gold', 'wild']).default('normal'),
  
  // 2. Foil (Edition)
  foil: z.enum(['none', 'foil', 'holographic', 'polychrome']).nullable().default(null),
  
  // 기타 속성
  isTemporary: z.boolean().optional(),
  durability: z.number().optional(),
  destroyChance: z.number().optional(),
});
```

---

## 📊 예시: 다양한 주사위

### 예시 1: 기본 주사위
```typescript
{
  id: 0,
  materialType: 'normal',
  foil: null,
  faces: [
    { value: 1, suit: '♠' },
    { value: 2, suit: '♠' },
    { value: 3, suit: '♠' },
    { value: 4, suit: '♠' },
    { value: 5, suit: '♠' },
    { value: 6, suit: '♠' },
  ],
  currentTopFace: 0,
}
```

### 예시 2: Glass + Polychrome 주사위
```typescript
{
  id: 1,
  materialType: 'glass',
  foil: 'polychrome',
  faces: [
    { value: 1, suit: '♥' },
    { value: 2, suit: '♥' },
    { value: 3, suit: '♥' },
    { value: 4, suit: '♥' },
    { value: 5, suit: '♥' },
    { value: 6, suit: '♥' },
  ],
  currentTopFace: 0,
}
// 효과: Mult ×2 (Glass) × 1.5 (Polychrome) = Mult ×3
```

### 예시 3: Wild 타입 주사위
```typescript
{
  id: 2,
  materialType: 'wild',
  foil: 'holographic',
  faces: [
    { value: 6, suit: '♠' },
    { value: 6, suit: '♦' },
    { value: 6, suit: '♥' },
    { value: 6, suit: '♣' },
    { value: 6, suit: 'None' },
    { value: 6, suit: 'None' },
  ],
  currentTopFace: 0,
}
// 효과: 모든 슈트로 간주 (Flush 빌드용), Mult +10% (Holographic)
```

---

## ✅ 체크리스트

- [x] 주사위 속성 4요소 정의
- [x] 각 요소의 효과 및 가치 명시
- [x] 주사위 생성 규칙 정의
- [x] 가치 계산 시스템 설계
- [ ] 데이터 구조 확장
- [ ] 생성 함수 구현
- [ ] UI 표시 시스템 구현



