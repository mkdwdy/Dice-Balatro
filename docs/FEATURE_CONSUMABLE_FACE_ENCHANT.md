# 피쳐: 소모품 주사위 커스터마이징 시스템

## 📋 개요
게임플레이 도중 소모품을 사용하여 주사위의 속성(타입, Foil, 슈트, 면 값)을 변경하는 시스템. 주사위 추가 시에는 랜덤화되어 등장하지만, 소모품으로 전략적 커스터마이징 가능.

## 🎯 목표
- 소모품 활용도 증가
- 전략적 선택 추가
- 실시간 커스터마이징 재미
- 랜덤 요소와 전략의 균형

## 🔧 설계

### 커스터마이징 타입
```typescript
type CustomizationType = 
  | 'material_type_change'  // 타입 변경 (Normal → Glass 등)
  | 'foil_add'              // Foil 추가
  | 'foil_change'           // Foil 변경
  | 'suit_change'           // 슈트 변경 (전체 또는 특정 면)
  | 'face_value_change'     // 면 값 변경 (특정 면)
  | 'face_batch_change';    // 여러 면 일괄 변경

interface DiceCustomization {
  consumableId: string;
  diceId: number;
  customizationType: CustomizationType;
  
  // 타입 변경
  newMaterialType?: DiceMaterialType;
  
  // Foil 변경
  newFoil?: FoilType | null;
  
  // 슈트 변경
  targetFaces?: number[];  // 변경할 면 인덱스 (없으면 전체)
  newSuit?: Suit;
  
  // 면 값 변경
  faceIndex?: number;      // 변경할 면 인덱스
  newValue?: number;       // 새로운 값
  batchChanges?: Array<{    // 여러 면 일괄 변경
    faceIndex: number;
    newValue?: number;
    newSuit?: Suit;
  }>;
}
```

### 사용 흐름
1. **소모품 선택**: 인벤토리에서 커스터마이징 소모품 선택
2. **주사위 선택**: 현재 덱의 주사위 중 하나 선택
3. **변경 옵션 선택**: 
   - 타입 변경: 새로운 타입 선택
   - Foil 추가/변경: Foil 타입 선택
   - 슈트 변경: 면 선택 (전체 또는 특정 면) + 새 슈트 선택
   - 면 값 변경: 면 선택 + 새 값 선택
4. **적용**: 즉시 반영, 소모품 소비

## 🎨 UI/UX
- 주사위 선택 시 6면 표시
- 인챈트 가능한 면 하이라이트
- 인챈트 효과 시각적 피드백

## ⚖️ 밸런싱
- 면 인챈트: 소모품 가격 $3-8
- 특수 능력: 더 비싼 소모품 필요
- 즉시 효과: 전략적 가치 높음

## 🚀 구현 단계
1. 소모품 사용 UI 개선
2. 주사위 면 선택 UI 추가
3. 면 인챈트 로직 구현
4. 즉시 적용 시스템 구현
5. 시각적 피드백 추가

