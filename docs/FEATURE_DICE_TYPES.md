# 피쳐: 주사위 타입/텍스처 시스템

## 📋 개요
주사위에 타입을 부여하여 특수 능력을 추가하는 시스템. 발라트로의 카드 타입 시스템에 해당.

## 🎯 목표
- 전략 다양성 확보
- 리스크/리워드 메커니즘 추가
- 시각적 다양성 제공

## 🔧 설계

### 주사위 타입
```typescript
type DiceMaterialType = 
  | 'normal'    // 기본 (흰색)
  | 'glass'     // Mult ×2, 파괴 확률 20%
  | 'stone'     // Chips +50, 족보 미포함
  | 'steel'     // 파괴 불가, Chips +20
  | 'gold'      // Mult +5, 골드 생성
  | 'wild';     // 모든 슈트로 간주

interface DiceMaterial {
  type: DiceMaterialType;
  texture: string;        // 텍스처 경로
  effects: {
    multMultiplier?: number;
    chipsBonus?: number;
    destroyChance?: number;
    isWild?: boolean;
    excludeFromHand?: boolean;
  };
}
```

### 타입별 효과
- **Glass**: Mult ×2, 사용 시 20% 파괴 확률
- **Stone**: Chips +50, 족보 계산에서 제외
- **Steel**: 파괴 불가, Chips +20
- **Gold**: Mult +5, 골드 +$2 생성
- **Wild**: 모든 슈트로 간주 (Flush 빌드용)

## 🎨 텍스처 디자인
- Normal: 흰색 기본
- Glass: 투명/반투명
- Stone: 회색 돌
- Steel: 은색 금속
- Gold: 금색
- Wild: 무지개색

## ⚖️ 밸런싱
- Normal: 기본 (무료)
- Glass: $10-15 (강력하지만 리스크)
- Stone: $8-12 (족보 제외 패널티)
- Steel: $12-18 (안정적)
- Gold: $15-20 (경제 효과)
- Wild: $10-15 (Flush 빌드용)

## 🚀 구현 단계
1. 주사위 타입 데이터 구조 추가
2. 텍스처 리소스 준비
3. 타입별 효과 로직 구현
4. UI에 타입 표시 추가



