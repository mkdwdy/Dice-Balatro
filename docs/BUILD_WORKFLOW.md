# 발라트로 빌드 시스템 워크플로우

## 개요

이 문서는 발라트로의 핵심 재미 요소인 "빌드" 시스템이 주사위 게임에 자연스럽게 통합될 수 있도록 설계한 워크플로우입니다.

## 빌드 시스템의 핵심 개념

### 빌드란?
빌드는 단순히 조커를 모으는 것이 아니라, **여러 조커가 상호작용하여 기하급수적으로 강해지는 조합**입니다.

### 빌드의 구성 요소
1. **핵심 조커 (Core Jokers)**: 빌드의 필수 조커
2. **보조 조커 (Synergy Jokers)**: 시너지를 높이는 선택적 조커
3. **전략 (Strategy)**: 빌드를 완성하기 위한 게임플레이 방법
4. **워크플로우 (Workflow)**: 초반/중반/후반 단계별 진행 방법

---

## 빌드 통합 워크플로우

### Phase 1: 빌드 발견 (Build Discovery)

#### 1.1 상점에서 빌드 힌트 제공
- 플레이어가 상점에 들어갈 때, 현재 보유한 조커를 기반으로 **추천 빌드** 표시
- 예: "현재 보유한 조커로 'Flush 빌드'를 시작할 수 있습니다!"

#### 1.2 빌드 카드 UI
- 상점에서 조커를 구매할 때, 해당 조커가 포함된 빌드 목록 표시
- 예: "이 조커는 'Flush 빌드'의 핵심 조커입니다"

#### 1.3 빌드 진행도 표시
- 게임 화면에 현재 빌드 진행도 표시
- 예: "Flush 빌드 진행도: 3/6 (핵심 조커)"

### Phase 2: 빌드 구성 (Build Assembly)

#### 2.1 조커 슬롯 관리
- 조커 슬롯에 빌드별로 색상 코딩
- 같은 빌드의 조커는 같은 색상으로 표시
- 빌드 완성도에 따라 시각적 피드백 제공

#### 2.2 빌드 시너지 표시
- 조커를 장착할 때, 다른 조커와의 시너지 표시
- 예: "이 조커는 'Greedy Joker'와 함께 사용하면 +50% 효과 증가"

#### 2.3 빌드 완성 알림
- 핵심 조커를 모두 모으면 빌드 완성 알림
- 예: "축하합니다! 'Flush 빌드'가 완성되었습니다!"

### Phase 3: 빌드 실행 (Build Execution)

#### 3.1 자동 효과 계산
- 핸드 제출 시, 빌드에 포함된 모든 조커 효과 자동 계산
- 효과 적용 순서:
  1. 기본 Chips 계산
  2. Chips 보너스 적용
  3. Multiplier 보너스 적용
  4. Multiplier 배수 적용
  5. Retrigger 효과 적용

#### 3.2 빌드별 최적화 힌트
- 현재 빌드에 맞는 최적의 족보/주사위 조합 제안
- 예: "Flush 빌드: 같은 슈트 주사위 5개를 모으세요"

#### 3.3 빌드 성장 표시
- 성장형 빌드의 경우, 매 핸드마다 성장 수치 표시
- 예: "Campfire: 스테이지 클리어로 ×0.5 Mult 증가"

### Phase 4: 빌드 전환 (Build Transition)

#### 4.1 빌드 전환 제안
- 현재 빌드가 약하거나, 더 강한 빌드로 전환 가능할 때 제안
- 예: "현재 'Pair 빌드'에서 'Two Pair 빌드'로 전환할 수 있습니다"

#### 4.2 조커 판매 가이드
- 빌드 전환 시, 판매해야 할 조커와 유지해야 할 조커 표시
- 예: "이 조커는 새 빌드에 필요하지 않습니다. 판매를 고려하세요"

---

## 게임플레이 통합 방법

### 1. 상점 시스템 통합

```typescript
// 상점에서 빌드 추천
function getRecommendedBuilds(availableJokers: string[], stage: number) {
  return getRecommendedBuilds(availableJokers, stage);
}

// 조커 구매 시 빌드 정보 표시
function getBuildsForJoker(jokerId: string) {
  return getBuildsByJoker(jokerId);
}
```

### 2. 게임 화면 통합

```typescript
// 현재 빌드 진행도 표시
function getCurrentBuildProgress(jokers: Joker[]) {
  const jokerIds = jokers.map(j => j.id);
  const builds = balatroBuilds.filter(build => 
    build.coreJokers.some(id => jokerIds.includes(id))
  );
  
  return builds.map(build => ({
    build,
    progress: build.coreJokers.filter(id => jokerIds.includes(id)).length,
    total: build.coreJokers.length,
  }));
}
```

### 3. 데미지 계산 통합

```typescript
// 빌드 효과를 포함한 데미지 계산
function calculateDamageWithBuilds(
  hand: Hand,
  dices: Dice[],
  jokers: Joker[],
  handUpgrades: Record<string, number>
) {
  // 기본 계산
  let chips = getChips(dices, hand);
  let multiplier = hand.multiplier + (handUpgrades[hand.name] || 0);
  
  // 조커 효과 적용 (빌드별로 그룹화)
  const builds = getActiveBuilds(jokers);
  
  for (const build of builds) {
    const buildJokers = jokers.filter(j => 
      build.coreJokers.includes(j.id) || 
      build.synergyJokers.includes(j.id)
    );
    
    // 빌드별 효과 계산
    const buildEffects = calculateBuildEffects(build, buildJokers, hand, dices);
    chips += buildEffects.chips;
    multiplier += buildEffects.multiplier;
    multiplier *= buildEffects.multiplierMultiplier;
  }
  
  // Retrigger 효과 적용
  const retriggerCount = getRetriggerCount(jokers);
  for (let i = 0; i < retriggerCount; i++) {
    // 효과 재계산
  }
  
  return chips * (multiplier + 1);
}
```

---

## 빌드별 게임플레이 가이드

### Flush 빌드 (플러시 빌드)

#### 초반 (스테이지 1-3)
1. 슈트별 조커 수집 (Greedy, Lusty, Wrathful, Gluttonous 중 하나)
2. 타로 카드로 주사위 슈트 변환
3. 같은 슈트 주사위 3-4개 모으기

#### 중반 (스테이지 4-6)
1. Flush 강화 조커 추가 (Droll, Canio)
2. 행성 카드로 Flush 족보 강화
3. Four Fingers로 Flush를 4장으로 만들기

#### 후반 (스테이지 7+)
1. 슈트별 레어 조커 추가 (Rough Gem, Bloodstone, Arrowhead, Onyx Agate)
2. Retrigger 조커 추가 (Triboulet, Mime)
3. 최적화: 모든 주사위를 같은 슈트로 설정

### Pair 빌드 (페어 빌드)

#### 초반
1. Jolly Joker와 Sly Joker 수집
2. Pair 족보를 자주 내기
3. 행성 카드로 Pair 족보 강화

#### 중반
1. Mad Joker 추가 (Two Pair 시너지)
2. Photograph 추가 (첫 번째 카드 보너스)
3. Pair → Two Pair 전환 고려

#### 후반
1. 더 강한 빌드로 전환 (Triple, Full House)
2. 또는 Pair 빌드 최적화 (모든 조커 Pair 관련)

### 성장형 빌드 (Scaling Builds)

#### 초반
1. 생존에 집중
2. 성장 조커 수집 (Campfire, Hiker)
3. 골드 모으기

#### 중반
1. 성장 조커 효과 누적
2. 안정적인 데미지 확보
3. 추가 성장 조커 추가

#### 후반
1. 무한 성장 시작
2. Retrigger 조커 추가
3. 최대 데미지 달성

---

## UI/UX 제안

### 1. 빌드 카드 UI
- 빌드 이름과 설명
- 핵심 조커 목록 (보유/미보유 표시)
- 빌드 진행도 바
- 예상 데미지 범위

### 2. 조커 슬롯 UI
- 빌드별 색상 코딩
- 시너지 표시 (조커 간 연결선)
- 빌드 완성도 표시

### 3. 게임 화면 UI
- 현재 활성 빌드 표시
- 빌드 효과 미리보기
- 최적 족보 제안

### 4. 상점 UI
- 추천 빌드 섹션
- 조커 구매 시 빌드 정보 툴팁
- 빌드 완성 가능성 표시

---

## 구현 우선순위

### Phase 1: 기본 시스템 (필수)
1. ✅ 빌드 데이터베이스 구축
2. 빌드 검색 및 필터링 함수
3. 현재 빌드 진행도 계산
4. 빌드 추천 시스템

### Phase 2: UI 통합 (중요)
1. 상점에서 빌드 추천 표시
2. 게임 화면에 빌드 진행도 표시
3. 조커 슬롯에 빌드 색상 코딩
4. 빌드 완성 알림

### Phase 3: 게임플레이 통합 (핵심)
1. 빌드 효과를 데미지 계산에 통합
2. 빌드별 최적 족보 제안
3. 빌드 전환 가이드
4. 빌드 성장 표시

### Phase 4: 고급 기능 (선택)
1. 빌드 통계 및 분석
2. 플레이어별 빌드 히스토리
3. 빌드 밸런싱 조정
4. 새로운 빌드 추가

---

## 다음 단계

1. **빌드 데이터베이스 검토**: 현재 10개 빌드가 적절한지 확인
2. **빌드 효과 계산 로직 구현**: 각 빌드의 효과를 실제 게임에 적용
3. **UI 프로토타입**: 빌드 표시 UI 디자인 및 구현
4. **테스트**: 실제 게임플레이에서 빌드 시스템 테스트

---

## 참고 자료

- `benchmark/balatro-builds-db.ts`: 빌드 데이터베이스
- `benchmark/balatro-jokers-db.ts`: 조커 데이터베이스
- `docs/BUILD_MECHANICS_QUESTIONS.md`: 빌드 메커니즘 질문 문서



