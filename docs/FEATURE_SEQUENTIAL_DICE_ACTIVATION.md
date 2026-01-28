# 피쳐: 주사위 순차 발동 시스템

## 📋 개요
주사위를 하나씩 순차적으로 발동하며 각 주사위마다 조커 효과를 적용하는 시스템. 발라트로의 핵심 메커니즘.

## 🎯 목표
- 조커 순서의 중요성 부여
- 재발동 빌드 가능
- 전략 깊이 확보

## 🔧 설계

### 발동 순서
1. 잠긴 주사위를 왼쪽부터 순차 발동
2. 각 주사위 발동 시:
   - 해당 주사위의 Chips 계산
   - 조커 효과 적용 (순서대로)
   - 재발동 체크
3. 모든 주사위 발동 후 최종 데미지 계산

### 조커 효과 적용 순서
```typescript
function applyJokerEffects(dice: Dice, jokers: Joker[]): {
  chips: number;
  mult: number;
} {
  let chips = dice.value;
  let mult = 0;
  
  // 조커 순서대로 적용
  for (const joker of jokers) {
    const effect = getJokerEffect(joker, dice);
    chips += effect.chips || 0;
    mult += effect.mult || 0;
    mult *= effect.multMultiplier || 1;
    
    // 재발동 체크
    if (effect.retrigger) {
      // 효과 재적용
    }
  }
  
  return { chips, mult };
}
```

## 🎨 애니메이션
- 주사위가 하나씩 하이라이트
- 조커 효과 시각적 표시
- 재발동 시 주사위 재발동 애니메이션

## ⚖️ 밸런싱
- 발동 속도: 너무 느리면 게임 속도 저하
- 조커 순서: 위치에 따라 효과 차이 명확히
- 재발동: 강력하지만 제한적

## 🚀 구현 단계
1. 순차 발동 로직 구현
2. 조커 효과 순차 적용 로직
3. 재발동 시스템 구현
4. 애니메이션 추가
5. UI 피드백 개선



