# 브라우저 자동화 씬 관리 가이드

## 문제점

브라우저 자동화 테스트 중에 현재 페이지 상태를 확인하지 않고 이전 스냅샷의 ref를 사용하여 잘못된 씬에서 잘못된 명령을 호출하는 문제가 발생하고 있습니다.

### 발생한 문제 사례

1. **메인 화면에서 Triple 버튼 클릭 시도**
   - 메인 화면에는 Triple 버튼이 존재하지 않음
   - 게임을 시작해야만 Triple 버튼이 나타남
   - 해결: 먼저 게임 시작 → 스테이지 선택 → 게임 화면 이동 필요

2. **테스트 패널이 닫혀있을 때 테스트 패널 내부 버튼 클릭 시도**
   - 테스트 패널이 닫혀있으면 내부 버튼의 ref가 접근성 트리에 없음
   - 해결: 테스트 패널을 먼저 열어야 함

3. **스테이지 선택 화면에서 게임 화면 요소 클릭 시도**
   - 스테이지 선택 화면에는 게임 화면 요소가 없음
   - 해결: 먼저 스테이지를 시작해야 함

4. **게임 플로우 무시: ROLL DICE 없이 바로 족보 생성**
   - 스테이지 시작 후 가장 먼저 해야 할 행동은 ROLL DICE 버튼 클릭
   - 하지만 테스트에서 바로 디버그 도구로 족보를 강제 생성함
   - 해결: 정상적인 게임 플로우를 따라야 함 (ROLL DICE → 주사위 선택 → 족보 선택 → 제출)

## 씬(Scene) 정의

### 1. 메인 화면 (Main Menu)
- **URL 패턴**: `http://localhost:5000/`
- **주요 요소**:
  - "START NEW GAME" 버튼
- **가능한 액션**:
  - 게임 시작 버튼 클릭

### 2. 스테이지 선택 화면 (Stage Select)
- **URL 패턴**: `http://localhost:5000/stage-select/:gameId`
- **주요 요소**:
  - "STAGE MAP" 제목
  - "START STAGE X" 버튼들
  - "RESET" 버튼
- **가능한 액션**:
  - 스테이지 시작 버튼 클릭
  - 리셋 버튼 클릭

### 3. 게임 화면 (Game Screen)
- **URL 패턴**: `http://localhost:5000/game/:gameId`
- **주요 요소**:
  - "STAGE X-Y" 제목
  - 주사위 영역
  - "ROLL DICE" 버튼 (가장 먼저 클릭해야 함)
  - "TEST" 버튼 (테스트 패널 토글)
  - 테스트 패널 (열려있을 때만):
    - 족보 생성 버튼들 (Pair, Triple, Straight 3, Flush)
    - 적 처치 버튼
- **정상적인 게임 플로우**:
  1. **ROLL DICE 버튼 클릭** (필수 첫 단계)
  2. 주사위가 굴려짐
  3. 원하는 주사위 선택 및 잠금
  4. 족보 선택
  5. 제출 버튼 클릭
- **가능한 액션**:
  - 주사위 굴리기 (ROLL DICE)
  - 주사위 선택 및 잠금
  - 족보 선택
  - 제출
  - 테스트 패널 열기/닫기 (디버그용)

### 4. 상점 화면 (Shop)
- **URL 패턴**: `http://localhost:5000/shop/:gameId`
- **주요 요소**:
  - 상점 아이템들
  - 구매 버튼들
  - "Continue" 버튼
- **가능한 액션**:
  - 아이템 구매
  - 상점 나가기

## 올바른 자동화 패턴

### 패턴 1: 정상적인 게임 플로우 따르기

```typescript
// ✅ 좋은 예: 정상적인 게임 플로우
async function playNormalGameFlow() {
  // 1. 게임 화면으로 이동
  await ensureGameScreen();
  
  // 2. ROLL DICE 버튼 클릭 (가장 먼저 해야 할 행동)
  const snapshot = await browser_snapshot();
  const rollDiceButtonRef = findRefByText(snapshot, "ROLL DICE");
  await browser_click({ element: "ROLL DICE", ref: rollDiceButtonRef });
  await browser_wait_for({ time: 3 }); // 주사위 굴리기 대기
  
  // 3. 주사위 선택 및 잠금
  const diceSnapshot = await browser_snapshot();
  // 원하는 주사위 선택...
  
  // 4. 족보 선택
  // 족보 선택...
  
  // 5. 제출
  // 제출 버튼 클릭...
}

// ❌ 나쁜 예: 게임 플로우 무시하고 바로 디버그 도구 사용
async function playWithDebugTool() {
  await ensureGameScreen();
  await ensureTestPanelOpen();
  // ROLL DICE 없이 바로 족보 생성 - 잘못된 플로우!
  await browser_click({ element: "Triple", ref: "e258" });
}
```

### 패턴 2: 씬 확인 후 액션 수행

```typescript
// ✅ 좋은 예: 현재 씬 확인 후 적절한 액션 수행
const snapshot = await browser_snapshot();
const url = await browser_evaluate(() => window.location.href);

if (url.includes('/game/')) {
  // 게임 화면인지 확인
  const hasRollDiceButton = snapshot.includes('ROLL DICE');
  if (hasRollDiceButton) {
    // ROLL DICE 버튼이 있으면 먼저 클릭
    await browser_click({ element: "ROLL DICE", ref: "e215" });
    await browser_wait_for({ time: 3 });
  }
  // 이제 주사위 선택 가능
} else if (url === 'http://localhost:5000/') {
  // 메인 화면이면 게임 시작
  await browser_click({ element: "START NEW GAME", ref: "e31" });
}
```

### 패턴 3: 헬퍼 함수 사용

```typescript
async function ensureGameScreen() {
  const url = await browser_evaluate(() => window.location.href);
  
  if (url === 'http://localhost:5000/') {
    // 메인 화면 → 게임 시작
    await browser_click({ element: "START NEW GAME", ref: "e31" });
    await browser_wait_for({ time: 3 });
  }
  
  if (url.includes('/stage-select/')) {
    // 스테이지 선택 → 스테이지 시작
    await browser_click({ element: "START STAGE 1", ref: "e138" });
    await browser_wait_for({ time: 3 });
  }
  
  // 게임 화면 확인
  const currentUrl = await browser_evaluate(() => window.location.href);
  if (!currentUrl.includes('/game/')) {
    throw new Error('Failed to navigate to game screen');
  }
}

async function ensureRollDiceDone() {
  const snapshot = await browser_snapshot();
  const hasRollDiceButton = snapshot.includes('ROLL DICE');
  
  if (hasRollDiceButton) {
    // ROLL DICE 버튼이 있으면 아직 주사위를 굴리지 않은 상태
    await browser_click({ element: "ROLL DICE", ref: "e215" });
    await browser_wait_for({ time: 3 });
  }
  
  // 주사위가 굴려졌는지 확인
  const diceCount = await browser_evaluate(() => {
    return Array.from(document.querySelectorAll('[data-testid^="dice-"]')).length;
  });
  
  if (diceCount === 0) {
    throw new Error('Dice not rolled yet');
  }
}
```

## 체크리스트

각 명령 호출 전에 다음을 확인해야 합니다:

- [ ] 현재 URL이 무엇인가?
- [ ] 현재 씬에 필요한 요소가 존재하는가?
- [ ] 요소가 접근 가능한 상태인가? (예: 테스트 패널이 열려있는가?)
- [ ] 이전 단계가 완료되었는가?
- [ ] **정상적인 게임 플로우를 따르고 있는가?** (ROLL DICE → 주사위 선택 → 족보 선택 → 제출)

## 자동화 테스트 플로우 예시

### 정상적인 게임 플로우 테스트

```typescript
// 1. 게임 화면으로 이동
await ensureGameScreen();

// 2. ROLL DICE 버튼 클릭 (가장 먼저 해야 할 행동)
const snapshot = await browser_snapshot();
const rollDiceButtonRef = findRefByText(snapshot, "ROLL DICE");
await browser_click({ element: "ROLL DICE", ref: rollDiceButtonRef });
await browser_wait_for({ time: 3 });

// 3. 주사위 선택 및 잠금
const diceSnapshot = await browser_snapshot();
// 원하는 주사위 선택...

// 4. 족보 선택
// 족보 선택...

// 5. 제출
// 제출 버튼 클릭...

// 6. 결과 확인
await browser_wait_for({ time: 3 });
const finalSnapshot = await browser_snapshot();
// 데미지가 정수로 표시되는지 확인
```

### 디버그 도구 사용 (테스트 전용)

```typescript
// 디버그 도구는 정상적인 게임 플로우를 테스트하기 위한 것이 아니라
// 특정 상태를 빠르게 만들기 위한 도구입니다.
// 따라서 정상적인 게임 플로우 테스트가 아닌 경우에만 사용해야 합니다.

async function testWithDebugTool() {
  await ensureGameScreen();
  
  // 디버그 도구 사용 (정상 플로우가 아닌 경우)
  await ensureTestPanelOpen();
  await browser_click({ element: "Triple", ref: "e258" });
  await browser_click({ element: "적 처치", ref: "e268" });
  
  // 하지만 이것은 정상적인 게임 플로우가 아닙니다!
}
```

## 개선 사항

1. **씬 감지 함수**: 현재 씬을 자동으로 감지하는 함수 작성
2. **상태 확인 함수**: 필요한 요소가 존재하는지 확인하는 함수 작성
3. **안전한 클릭 함수**: 요소 존재 여부 확인 후 클릭하는 함수 작성
4. **에러 처리**: 잘못된 씬에서 명령 호출 시 명확한 에러 메시지
5. **게임 플로우 준수**: 정상적인 게임 플로우를 따르는지 확인하는 함수 작성
