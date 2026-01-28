# 피쳐: Foil 인챈트 시스템

## 📋 개요
주사위 위에 Foil을 씌워 특수 효과를 부여하는 시스템. 발라트로의 Edition 시스템에 해당.

## 🎯 목표
- 주사위 커스터마이징 재미 추가
- 시각적 피드백 향상
- 전략적 선택 추가

## 🔧 설계

### Foil 타입
```typescript
type FoilType = 
  | 'foil'          // +10% Chips
  | 'holographic'   // +10% Mult
  | 'polychrome';   // ×1.5 Mult

interface FoilEnchant {
  type: FoilType;
  appliedTo: number; // 주사위 ID
}
```

### 인챈트 방법
- 소모품 사용: 특정 타로/스펙트럴 카드로 Foil 적용
- 상점 구매: Foil 인챈트 아이템 구매

## 🎨 시각적 효과
- Foil: 반사 효과
- Holographic: 무지개 빛 효과
- Polychrome: 색상 변화 효과

## ⚖️ 밸런싱
- Foil: $5-8
- Holographic: $8-12
- Polychrome: $12-15

## 🚀 구현 단계
1. Foil 데이터 구조 추가
2. 주사위 모델에 Foil 효과 추가
3. 인챈트 UI 구현
4. 효과 적용 로직 구현



