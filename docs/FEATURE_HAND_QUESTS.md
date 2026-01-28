# 피쳐: 족보 퀘스트 시스템

## 📋 개요
특정 족보를 완성하면 발동되는 보너스/패널티 시스템. 아날로그 Yahtzee의 도전 과제와 유사.

## 🎯 목표
- 장기 목표 제공
- 발견의 재미 추가
- 반복 플레이 동기 부여

## 🔧 설계

### 퀘스트 타입
```typescript
type QuestDuration = 
  | 'temporary_rolls'    // X회 굴리기 동안
  | 'temporary_stages'   // X스테이지 동안
  | 'one_time';          // 1회 완수

interface HandQuest {
  id: string;
  name: string;
  condition: {
    handType: string;      // 족보 타입
    count?: number;         // 완성 횟수
  };
  reward: {
    type: 'mult' | 'chips' | 'gold' | 'reroll';
    value: number;
  };
  penalty?: {
    type: 'mult' | 'chips' | 'health';
    value: number;
  };
  duration: QuestDuration;
  durationValue?: number;
}
```

### 퀘스트 예시
- **"Pair Master"**: Pair 5회 완성 → Mult +2 (3스테이지 동안)
- **"Flush Challenge"**: Flush 3회 완성 → Chips +30 (영구)
- **"Yahtzee Legend"**: Yahtzee 1회 완성 → Mult ×2 (1회)

## 🎮 게임플레이
- 퀘스트는 상점에서 구매 가능
- 완성 시 즉시 효과 발동
- 진행 상황 UI 표시

## ⚖️ 밸런싱
- 퀘스트 가격: $5-15
- 보상: 완성 난이도에 비례
- 패널티: 강력한 보상의 대가

## 🚀 구현 단계
1. 퀘스트 데이터 구조 설계
2. 퀘스트 진행 추적 시스템
3. 보상/패널티 적용 로직
4. UI 표시 및 알림
5. 상점 연동



