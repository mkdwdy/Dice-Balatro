# 피쳐: 주사위 추가/제거 시스템

## 📋 개요

발라트로의 핵심 메커니즘인 "카드 추가/제거"를 주사위 게임에 적용한 시스템입니다.

---

## 🎯 목표

- 주사위 수량을 동적으로 변경 가능하게 함
- 조커와 소모품을 통해 주사위 추가/제거 가능
- 전략 깊이와 다양성 확보

---

## 🔧 기술 설계

### 데이터 구조 확장

```typescript
// shared/schema.ts 확장

// 주사위 덱에 최대 주사위 수량 추가
export const gameSessions = pgTable("game_sessions", {
  // ... 기존 필드들
  maxDiceCount: integer("max_dice_count").notNull().default(5), // 최대 주사위 수량
  minDiceCount: integer("min_dice_count").notNull().default(5), // 최소 주사위 수량
});

// 주사위 타입 확장
export const deckDiceSchema = z.object({
  id: z.number(),
  faces: z.array(diceFaceSchema).length(6), // 6개 면 (각 면: value + suit)
  currentTopFace: z.number().min(0).max(5),
  
  // 주사위 속성 (4가지 핵심 요소)
  materialType: z.enum(['normal', 'glass', 'stone', 'steel', 'gold', 'wild']).default('normal'), // 배경색/타입
  foil: z.enum(['none', 'foil', 'holographic', 'polychrome']).nullable().default(null), // Foil (Edition)
  
  // 기타 속성
  isTemporary: z.boolean().optional(), // 임시 주사위 여부
  durability: z.number().optional(), // 내구도 (소모성 주사위용)
  destroyChance: z.number().optional(), // 파괴 확률 (0-1)
});
```

### API 엔드포인트 추가

```typescript
// server/routes.ts

// 주사위 추가
app.post('/api/games/:id/dice/add', asyncHandler(async (req, res) => {
  // 새로운 주사위 생성 및 추가
}));

// 주사위 제거
app.post('/api/games/:id/dice/remove', asyncHandler(async (req, res) => {
  // 주사위 제거
}));
```

---

## 🎮 게임플레이 설계

### 주사위 속성 시스템

주사위는 다음 **4가지 핵심 요소**로 구성되며, 각 요소가 주사위의 가치와 효과를 결정합니다:

#### 1. 배경색/타입 (Material Type)
- **Normal** (흰색 기본): 기본 주사위, 특수 효과 없음
- **Glass**: Mult ×2, 사용 시 파괴 확률 20%
- **Stone**: Chips +50, 족보 계산에서 제외
- **Steel**: 파괴 불가, Chips +20
- **Gold**: Mult +5, 골드 생성
- **Wild**: 모든 슈트로 간주 (Flush 빌드용)

#### 2. Foil (Edition)
- **없음** (기본): 특수 효과 없음
- **Foil**: Chips +10%
- **Holographic**: Mult +10%
- **Polychrome**: Mult ×1.5

#### 3. 면의 숫자 (Face Values)
- 각 면의 값: 1, 2, 3, 4, 5, 6
- 기본 구성: 1-6 순차
- 인챈트로 변경 가능

#### 4. 면의 문양 (Face Suits)
- 각 면의 슈트: None, ♠, ♦, ♥, ♣
- 기본: 주사위별로 고정 슈트 (예: 첫 번째 주사위는 ♠, 두 번째는 ♦)
- 인챈트로 변경 가능

### 주사위 추가 방법 및 속성 결정

#### 1. 조커 효과

##### "Extra Dice" 조커
- **추가되는 주사위 속성**:
  - 타입: **Normal** (흰색 기본)
  - Foil: **없음**
  - 슈트: **랜덤** (♠, ♦, ♥, ♣ 중 하나)
  - 면 값: **기본** (1, 2, 3, 4, 5, 6)
- **타입**: 영구 주사위

##### "Dice Collector" 조커
- **추가되는 주사위 속성**:
  - 현재 덱의 주사위 중 **랜덤 복제**
  - 원본의 모든 속성 유지 (타입, Foil, 면 구성)
- **타입**: 영구 주사위

##### "Dice Duplicator" 조커
- **추가되는 주사위 속성**:
  - 특정 조건의 주사위 **복제**
  - 조건에 따라 속성 변형 가능
- **타입**: 조건에 따라 결정

#### 2. 소모품 사용

##### "Dice Summon" 타로 카드
- **추가되는 주사위 속성**:
  - 타입: **Normal**
  - Foil: **없음**
  - 슈트: **랜덤** 또는 **플레이어 선택**
  - 면 값: **기본** (1-6)
- **타입**: 임시 주사위 (1회용)

##### "Dice Pack" 소모품
- **추가되는 주사위 속성**:
  - 상점에서 구매한 주사위와 **동일한 속성**
  - 구매 시 선택한 속성 유지
- **타입**: 영구 주사위

##### "Premium Dice Pack" 소모품
- **추가되는 주사위 속성**:
  - 타입: **선택 가능** (Glass, Stone, Steel 등)
  - Foil: **선택 가능** (추가 비용)
  - 슈트: **커스터마이징 가능**
  - 면 값: **커스터마이징 가능**
- **타입**: 영구 주사위

#### 3. 상점 구매

##### 기본 주사위 ($5-10)
- **타입**: Normal (흰색)
- **Foil**: 없음
- **슈트**: 랜덤 또는 선택 가능
- **면 값**: 기본 (1-6)

##### 고급 주사위 ($15-25)
- **타입**: 선택 가능 (Glass, Stone, Steel 등)
- **Foil**: 선택 가능 (추가 비용)
- **슈트**: 커스터마이징 가능
- **면 값**: 커스터마이징 가능

##### 프리미엄 주사위 ($30+)
- **타입**: 모든 타입 선택 가능
- **Foil**: 모든 Edition 선택 가능
- **슈트**: 완전 커스터마이징
- **면 값**: 완전 커스터마이징
- **특수 효과**: 추가 능력 부여 가능

### 주사위 생성 규칙 및 가치 시스템

```typescript
// 주사위 속성 정의
interface DiceProperties {
  // 1. 배경색/타입
  materialType: 'normal' | 'glass' | 'stone' | 'steel' | 'gold' | 'wild';
  
  // 2. Foil (Edition)
  foil: 'none' | 'foil' | 'holographic' | 'polychrome' | null;
  
  // 3. 면의 숫자 (6개 면)
  faces: Array<{
    value: number;  // 1-6
    suit: 'None' | '♠' | '♦' | '♥' | '♣';
  }>;
  
  // 기타 속성
  isTemporary?: boolean;
  durability?: number;
  destroyChance?: number;
}

// 주사위 생성 규칙 (랜덤화 중심)
interface DiceGenerationRule {
  // 생성 타입
  generationType: 'basic' | 'random' | 'clone' | 'premium';
  
  // 기본 주사위 (고정 속성)
  isBasic?: boolean; // true면 Normal, Foil 없음 고정
  
  // 랜덤화 확률 (기본 주사위가 아닌 경우)
  materialTypeWeights?: Record<DiceMaterialType, number>;
  foilWeights?: Record<FoilType | 'none', number>;
  suitRandomize?: boolean;
  faceRandomize?: boolean;
  faceRandomizeChance?: number; // 면 값 랜덤화 확률
  
  // 복제 옵션
  cloneFrom?: number; // 주사위 ID
  cloneProperties?: ('materialType' | 'foil' | 'faces')[];
}

// 랜덤 가중치 설정
const DICE_GENERATION_WEIGHTS = {
  // 기본 주사위
  basic: {
    materialType: { normal: 100 },
    foil: { none: 100 },
  },
  
  // 일반 랜덤 주사위
  random: {
    materialType: {
      normal: 70,
      glass: 10,
      stone: 10,
      steel: 5,
      gold: 3,
      wild: 2,
    },
    foil: {
      none: 80,
      foil: 15,
      holographic: 4,
      polychrome: 1,
    },
  },
  
  // 프리미엄 주사위
  premium: {
    materialType: {
      normal: 0, // 제외
      glass: 30,
      stone: 20,
      steel: 20,
      gold: 20,
      wild: 10,
    },
    foil: {
      none: 30,
      foil: 40,
      holographic: 25,
      polychrome: 5,
    },
  },
};

// 주사위 생성 함수 (랜덤화 중심)
function generateDice(rule: DiceGenerationRule): DeckDice {
  const dice: DeckDice = {
    id: getNextDiceId(),
    currentTopFace: 0,
    // ... 기타 속성
  };
  
  // 기본 주사위인 경우
  if (rule.isBasic) {
    dice.materialType = 'normal';
    dice.foil = null;
    dice.faces = createDefaultFaces(getRandomSuit());
    return dice;
  }
  
  // 복제인 경우
  if (rule.cloneFrom) {
    const sourceDice = getDiceById(rule.cloneFrom);
    dice.materialType = rule.cloneProperties?.includes('materialType') 
      ? sourceDice.materialType 
      : getRandomMaterialType(rule.materialTypeWeights);
    dice.foil = rule.cloneProperties?.includes('foil')
      ? sourceDice.foil
      : getRandomFoil(rule.foilWeights);
    dice.faces = rule.cloneProperties?.includes('faces')
      ? [...sourceDice.faces]
      : createRandomFaces(rule.suitRandomize, rule.faceRandomizeChance);
    return dice;
  }
  
  // 랜덤 생성
  const weights = rule.generationType === 'premium' 
    ? DICE_GENERATION_WEIGHTS.premium
    : DICE_GENERATION_WEIGHTS.random;
  
  dice.materialType = getRandomMaterialType(weights.materialType);
  dice.foil = getRandomFoil(weights.foil);
  
  // 슈트 랜덤화
  const suit = rule.suitRandomize !== false ? getRandomSuit() : 'None';
  
  // 면 값 랜덤화
  if (rule.faceRandomizeChance && Math.random() < rule.faceRandomizeChance) {
    dice.faces = createRandomFaces(true, 1.0);
  } else {
    dice.faces = createDefaultFaces(suit);
  }
  
  return dice;
}

// 랜덤 타입 생성 (가중치 기반)
function getRandomMaterialType(weights?: Record<DiceMaterialType, number>): DiceMaterialType {
  const w = weights || DICE_GENERATION_WEIGHTS.random.materialType;
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [type, weight] of Object.entries(w)) {
    random -= weight;
    if (random <= 0) return type as DiceMaterialType;
  }
  return 'normal';
}

// 랜덤 Foil 생성 (가중치 기반)
function getRandomFoil(weights?: Record<FoilType | 'none', number>): FoilType | null {
  const w = weights || DICE_GENERATION_WEIGHTS.random.foil;
  const total = Object.values(w).reduce((a, b) => a + b, 0);
  let random = Math.random() * total;
  
  for (const [foil, weight] of Object.entries(w)) {
    random -= weight;
    if (random <= 0) {
      return foil === 'none' ? null : (foil as FoilType);
    }
  }
  return null;
}

// 랜덤 면 생성
function createRandomFaces(randomizeSuit: boolean, randomizeValues: number): DiceFace[] {
  const suit = randomizeSuit ? getRandomSuit() : 'None';
  const faces: DiceFace[] = [];
  
  if (randomizeValues >= 1.0) {
    // 완전 랜덤
    for (let i = 0; i < 6; i++) {
      faces.push({
        value: Math.floor(Math.random() * 6) + 1,
        suit: randomizeSuit ? getRandomSuit() : suit,
      });
    }
  } else {
    // 부분 랜덤 (기본 + 일부 변경)
    const baseFaces = createDefaultFaces(suit);
    for (let i = 0; i < 6; i++) {
      if (Math.random() < randomizeValues) {
        faces.push({
          value: Math.floor(Math.random() * 6) + 1,
          suit: randomizeSuit ? getRandomSuit() : suit,
        });
      } else {
        faces.push(baseFaces[i]);
      }
    }
  }
  
  return faces;
}

// 주사위 가치 계산
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
  
  // 3. 면 구성 보너스 (특수 조합)
  const faceBonus = calculateFaceBonus(dice.faces);
  
  // 4. 특수 효과 보너스
  const specialBonus = calculateSpecialBonus(dice);
  
  return baseValue + typeBonus + foilBonus + faceBonus + specialBonus;
}
```

### 주사위 추가 시 속성 결정 (랜덤화)

**모든 주사위 추가는 랜덤화되어 등장하며, 플레이어는 커스터마이징할 수 없습니다.**

#### 상점 구매 시
- **기본 주사위**: Normal 타입, Foil 없음 고정, 슈트 랜덤
- **고급 주사위**: 타입/Foil/슈트 모두 랜덤 (가중치 적용)
- **프리미엄 주사위**: 고급 타입/Foil 랜덤, 면 값 특수 구성 확률 증가

#### 조커/소모품 사용 시
- **모든 주사위**: 랜덤 속성으로 생성
- **복제 주사위**: 원본 속성 유지 (단, 조건에 따라 일부 변형 가능)

### 커스터마이징은 게임플레이 중 소모품으로만 가능

주사위 추가 후, 게임플레이 도중 소모품을 사용하여:
- 타입 변경
- Foil 추가/변경
- 슈트 변경
- 면 값 변경

이렇게 랜덤 요소로 재미를 주고, 소모품으로 전략적 선택을 제공합니다.

### 주사위 제거 방법

#### 1. 조커 효과
- **"Dice Destroyer" 조커**: 특정 조건에서 주사위 파괴 (보상 제공)
- **"Dice Sacrifice" 조커**: 주사위 제거 시 Mult 증가

#### 2. 소모품 사용
- **"Dice Removal" 타로 카드**: 주사위 1개 제거 (보상 제공)

#### 3. 소모성 주사위
- 내구도 소진 시 자동 파괴
- 파괴 확률에 의한 파괴

---

## 🎨 UI/UX 설계

### 주사위 표시
- **5개 이하**: 현재와 동일
- **6-8개**: 2줄로 표시 (상단 4개, 하단 나머지)
- **9개 이상**: 스크롤 가능한 그리드

### 주사위 추가/제거 피드백
- 추가 시: 주사위가 나타나는 애니메이션
- 제거 시: 주사위가 사라지는 애니메이션
- 임시 주사위: 반투명 효과 또는 특수 표시

---

## ⚖️ 밸런싱 고려사항

### 주사위 추가
- **너무 쉬움**: 게임이 쉬워짐
- **너무 어려움**: 사용하지 않음
- **권장**: 초반에는 어렵고, 후반에는 다양한 방법 제공

### 주사위 제거
- **리스크**: 주사위가 줄어들면 족보 만들기 어려워짐
- **리워드**: 제거 시 충분한 보상 필요
- **권장**: 제거 시 Mult 증가 등 강력한 보상

---

## 🚀 구현 단계

### Phase 1: 기본 구조
1. 데이터 구조 확장
2. API 엔드포인트 구현
3. 주사위 수량 관리 로직

### Phase 2: 조커/소모품 연동
1. 주사위 추가 조커 구현
2. 주사위 제거 조커 구현
3. 소모품 효과 구현

### Phase 3: UI/UX 개선
1. 다중 주사위 표시
2. 애니메이션 추가
3. 피드백 개선

---

## 📊 예상 영향

### 긍정적 영향
- 전략 깊이 대폭 증가
- 조커 효과 다양성 확보
- 발라트로와의 유사성 증가

### 부정적 영향
- UI 복잡도 증가
- 성능 이슈 가능성
- 밸런싱 난이도 증가

---

## ✅ 체크리스트

- [ ] 데이터 구조 확장
- [ ] API 엔드포인트 구현
- [ ] 주사위 수량 관리 로직
- [ ] 조커 효과 연동
- [ ] 소모품 효과 연동
- [ ] UI 다중 주사위 표시
- [ ] 애니메이션 구현
- [ ] 밸런싱 테스트

