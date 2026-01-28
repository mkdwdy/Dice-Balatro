# 브라우저 자동화 문제 분석 및 해결 방안

## 문제 분석

### 발견된 문제들

1. **접근성 트리 기반 스냅샷의 한계**
   - 브라우저 스냅샷은 접근성 트리를 기반으로 함
   - `absolute` 또는 `fixed` 포지셔닝된 요소가 화면 밖에 있으면 캡처되지 않을 수 있음
   - 예: 테스트 패널이 `absolute bottom-12 right-0`로 배치되어 접근성 트리에 포함되지 않음

2. **동적 콘텐츠 로딩 타이밍 문제**
   - React 컴포넌트가 렌더링되기 전에 스냅샷을 찍으면 요소가 보이지 않음
   - API 호출이 완료되기 전에 요소를 찾으려고 하면 타임아웃 발생
   - 예: TEST 버튼 클릭 후 테스트 패널이 나타나기까지 시간이 필요함

3. **요소 ref 변경 문제**
   - 페이지가 업데이트되면 요소의 ref가 변경됨
   - 이전 스냅샷의 ref로 클릭하려고 하면 요소를 찾을 수 없음
   - 예: 게임 상태 변경 시 버튼 ref가 변경됨

4. **서버 연결 문제**
   - 서버가 실행되지 않았을 때 `ERR_CONNECTION_REFUSED` 오류 발생
   - 서버 재시작 후 브라우저가 이전 세션을 유지하여 연결 실패

5. **브라우저 창 최소화/숨김 상태 문제**
   - 브라우저 창이 최소화되거나 다른 창에 가려지면 일부 기능이 제한될 수 있음
   - `document.hidden === true` 또는 `visibilityState === "hidden"` 상태
   - Canvas/WebGL 요소는 최소화 상태에서 렌더링이 중단될 수 있음
   - 접근성 트리는 여전히 업데이트되지만, 일부 요소의 상태가 다를 수 있음
   - 예: 3D 주사위가 최소화 상태에서 렌더링되지 않아 접근성 트리에 포함되지 않을 수 있음

## 실제 발생한 문제 사례

### 문제 1: 스테이지 시작 버튼 클릭 후 페이지 전환 대기 실패

**증상**:
- `browser_click`으로 "START STAGE 2" 버튼 클릭 성공
- `browser_wait_for({ text: "STAGE 2-1" })` 타임아웃 발생
- 실제로는 페이지가 전환되었지만 대기 조건이 실패

**원인 분석**:
1. 접근성 트리에서 텍스트를 찾는 데 시간이 걸림
2. React 컴포넌트가 렌더링되기 전에 텍스트 검색 시도
3. 고정된 시간 대기(`time` 파라미터)보다 조건부 대기(`text` 파라미터)가 더 느림

**해결 방법**:
```typescript
// 나쁜 예: 텍스트 기반 대기 (타임아웃 발생 가능)
browser_wait_for({ text: "STAGE 2-1" })

// 좋은 예: URL 변경 확인 + 고정 시간 대기
browser_click({ element: "START STAGE 2", ref: "e511" })
browser_wait_for({ time: 3 })
browser_evaluate(() => {
  return window.location.href.includes('/game/');
})
```

**결과**: 페이지 전환 성공, 게임 화면 표시 확인

### 문제 2: 조커 효과 발동 확인

**테스트 시나리오**:
1. 상점에서 Lucky Joker 구매 ($5)
2. 게임 화면에서 조커 인벤토리 확인
3. Triple 족보로 데미지 계산하여 조커 효과 발동 확인

**결과**:
- ✅ 조커가 인벤토리에 표시됨: "Lucky Joker: +10% damage on all hands"
- ✅ 데미지 계산 화면에 조커 발동 표시: "🃏 Lucky Joker"
- ✅ 최종 데미지 계산 성공: 89.87 DAMAGE!

## 해결 방안

### 1. 스냅샷 전 대기 시간 확보

**문제**: 동적 콘텐츠가 로드되기 전에 스냅샷을 찍음

**해결**:
- `browser_wait_for`를 사용하여 특정 텍스트나 요소가 나타날 때까지 대기
- 고정된 시간 대기(`time` 파라미터)보다는 조건부 대기(`text` 파라미터) 사용

**예시**:
```typescript
// 나쁜 예: 고정 시간 대기
browser_wait_for({ time: 2 })

// 좋은 예: 조건부 대기
browser_wait_for({ text: "테스트 도구" })
```

### 2. JavaScript로 DOM 직접 확인

**문제**: 접근성 트리에 포함되지 않은 요소는 스냅샷에 나타나지 않음

**해결**:
- `browser_evaluate`를 사용하여 JavaScript로 DOM을 직접 확인
- CSS 선택자나 XPath를 사용하여 요소 찾기

**예시**:
```typescript
browser_evaluate({
  function: () => {
    const panel = document.querySelector('.absolute.bottom-12');
    return panel ? 'visible' : 'not found';
  }
})
```

### 3. 요소 찾기 전략 개선

**문제**: ref가 변경되면 이전 ref로 클릭할 수 없음

**해결**:
- 스냅샷을 찍은 직후에 요소를 사용
- 요소를 찾을 수 없으면 스냅샷을 다시 찍고 최신 ref 사용
- 텍스트 기반 선택자 사용 (가능한 경우)

**예시**:
```typescript
// 1. 스냅샷 찍기
const snapshot = browser_snapshot()

// 2. 최신 ref로 요소 찾기
const buttonRef = snapshot에서 찾기

// 3. 즉시 사용
browser_click({ element: "버튼", ref: buttonRef })
```

### 4. 서버 상태 확인

**문제**: 서버가 실행되지 않았을 때 연결 실패

**해결**:
- 브라우저 자동화 전에 서버 상태 확인
- 서버가 실행 중이 아니면 재시작
- 연결 실패 시 재시도 로직 추가

**예시**:
```typescript
// 서버 상태 확인
const serverStatus = checkServerStatus()

if (!serverStatus.running) {
  startServer()
  waitForServerReady()
}

// 브라우저 접속
browser_navigate({ url: "http://localhost:5000" })
```

### 5. 에러 처리 및 재시도

**문제**: 타임아웃이나 요소를 찾을 수 없는 경우 실패

**해결**:
- 타임아웃 발생 시 재시도 로직 추가
- 요소를 찾을 수 없으면 스냅샷을 다시 찍고 재시도
- 최대 재시도 횟수 설정

**예시**:
```typescript
async function clickWithRetry(element, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      const snapshot = browser_snapshot()
      const ref = findElementRef(snapshot, element)
      browser_click({ element, ref })
      return
    } catch (error) {
      if (i === maxRetries - 1) throw error
      await wait(1000)
    }
  }
}
```

## 권장 워크플로우

### 브라우저 자동화 테스트 시

1. **서버 상태 확인**
   ```typescript
   checkServerStatus() → 재시작 필요 시 재시작
   ```

2. **페이지 접속 및 로딩 대기**
   ```typescript
   browser_navigate({ url })
   browser_wait_for({ text: "예상되는 텍스트" })
   ```

3. **스냅샷 찍기**
   ```typescript
   const snapshot = browser_snapshot()
   ```

4. **요소 찾기 및 상호작용**
   ```typescript
   const ref = findElementRef(snapshot, "요소 설명")
   browser_click({ element: "요소 설명", ref })
   ```

5. **결과 확인 대기**
   ```typescript
   browser_wait_for({ text: "예상되는 결과 텍스트" })
   browser_snapshot() // 결과 확인
   ```

### 문제 발생 시 디버깅

1. **스냅샷 확인**: 현재 페이지 상태 확인
2. **콘솔 메시지 확인**: JavaScript 오류 확인
3. **네트워크 요청 확인**: API 호출 실패 확인
4. **DOM 직접 확인**: `browser_evaluate`로 요소 존재 여부 확인

## 개선된 테스트 스크립트 예시

```typescript
// 개선된 브라우저 자동화 테스트
async function testGameFlow() {
  // 1. 서버 상태 확인
  if (!await isServerRunning()) {
    await startServer()
    await waitForServerReady()
  }

  // 2. 페이지 접속
  browser_navigate({ url: "http://localhost:5000" })
  browser_wait_for({ text: "YAHTZEE BALATRO" })

  // 3. 게임 시작
  let snapshot = browser_snapshot()
  const startButtonRef = findRefByText(snapshot, "START NEW GAME")
  browser_click({ element: "START NEW GAME", ref: startButtonRef })
  
  // 4. 스테이지 선택 대기
  browser_wait_for({ text: "STAGE MAP" })
  snapshot = browser_snapshot()
  
  // 5. 스테이지 시작
  const stageButtonRef = findRefByText(snapshot, "START STAGE 1")
  browser_click({ element: "START STAGE 1", ref: stageButtonRef })
  
  // 6. 게임 화면 대기
  browser_wait_for({ text: "STAGE 1-1" })
  
  // 7. 테스트 패널 열기
  snapshot = browser_snapshot()
  const testButtonRef = findRefByText(snapshot, "TEST")
  browser_click({ element: "TEST", ref: testButtonRef })
  
  // 8. 테스트 패널이 나타날 때까지 대기 (JavaScript로 확인)
  await waitForElement(() => {
    return document.querySelector('.absolute.bottom-12') !== null
  })
  
  // 9. 테스트 패널 요소 찾기
  snapshot = browser_snapshot()
  const tripleButtonRef = findRefByText(snapshot, "Triple")
  browser_click({ element: "Triple", ref: tripleButtonRef })
  
  // ... 나머지 테스트
}
```

## 최근 발생한 클릭 실패 사례 분석

### 문제 3: 스냅샷 후 ref 변경으로 인한 클릭 실패

**증상**:
```
Error calling tool browser_click: Timeout 30000ms exceeded.
Call log:
  - waiting for locator('aria-ref=e220')
```

**원인 분석**:
1. **스냅샷과 클릭 사이의 시간 지연**: 스냅샷을 찍은 후 다른 작업을 수행하는 동안 페이지가 업데이트되어 ref가 변경됨
2. **React 리렌더링**: 상태 변경이나 API 응답으로 인한 리렌더링 시 요소의 접근성 트리 위치가 변경됨
3. **비동기 작업 완료 전 클릭 시도**: API 호출이나 상태 업데이트가 완료되기 전에 클릭을 시도함

**해결 방법**:
```typescript
// 나쁜 예: 스냅샷을 찍고 시간이 지난 후 클릭
const snapshot = browser_snapshot()
// ... 다른 작업 수행 (시간 소요)
browser_click({ element: "버튼", ref: "e220" }) // ref가 변경되어 실패

// 좋은 예: 스냅샷 직후 즉시 클릭
const snapshot = browser_snapshot()
const buttonRef = findRefInSnapshot(snapshot, "START STAGE 1")
browser_click({ element: "START STAGE 1", ref: buttonRef }) // 즉시 사용

// 더 좋은 예: 클릭 전 스냅샷 재확인
browser_wait_for({ text: "STAGE MAP" }) // 페이지 로드 대기
const snapshot = browser_snapshot() // 최신 스냅샷
const buttonRef = findRefInSnapshot(snapshot, "START STAGE 1")
browser_click({ element: "START STAGE 1", ref: buttonRef })
```

### 문제 4: 요소가 아직 렌더링되지 않음

**증상**:
- 스냅샷에는 요소가 보이지만 클릭 시 타임아웃 발생
- `element is not enabled` 오류

**원인 분석**:
1. **React 컴포넌트 마운트 지연**: 컴포넌트가 아직 DOM에 마운트되지 않음
2. **CSS 애니메이션/트랜지션**: 요소가 보이지만 아직 클릭 가능한 상태가 아님
3. **비활성화 상태**: 요소가 `disabled` 상태이거나 다른 요소에 가려져 있음

**해결 방법**:
```typescript
// 나쁜 예: 스냅샷만 보고 클릭
const snapshot = browser_snapshot()
browser_click({ element: "SUBMIT", ref: "e93" }) // disabled 상태일 수 있음

// 좋은 예: 요소 상태 확인 후 클릭
browser_evaluate(() => {
  const button = Array.from(document.querySelectorAll('button')).find(
    btn => btn.textContent?.includes('SUBMIT')
  );
  return {
    exists: !!button,
    disabled: button?.disabled || false,
    visible: button?.offsetParent !== null
  };
})
// 상태 확인 후 클릭
browser_click({ element: "SUBMIT", ref: "e93" })
```

### 문제 5: 페이지 전환 중 클릭 시도

**증상**:
- 페이지 전환 중에 이전 페이지의 요소를 클릭하려고 시도
- `waiting for locator` 타임아웃 발생

**원인 분석**:
1. **비동기 페이지 전환**: 클릭 후 페이지가 전환되는 동안 다음 명령 실행
2. **로딩 상태 미확인**: 새 페이지가 완전히 로드되기 전에 요소 찾기 시도

**해결 방법**:
```typescript
// 나쁜 예: 페이지 전환 대기 없이 클릭
browser_click({ element: "START STAGE 1", ref: "e138" })
browser_click({ element: "ROLL DICE", ref: "e298" }) // 아직 게임 화면이 아님

// 좋은 예: 페이지 전환 대기 후 클릭
browser_click({ element: "START STAGE 1", ref: "e138" })
browser_wait_for({ time: 3 }) // 페이지 전환 대기
browser_evaluate(() => window.location.href.includes('/game/')) // URL 확인
const snapshot = browser_snapshot() // 새 페이지 스냅샷
const rollButtonRef = findRefInSnapshot(snapshot, "ROLL DICE")
browser_click({ element: "ROLL DICE", ref: rollButtonRef })
```

## MCP 브라우저 자동화 실패의 주요 원인 요약

### 1. **Ref 변경 문제** (가장 흔함)
- **원인**: 스냅샷을 찍은 후 시간이 지나거나 페이지가 업데이트되면 ref가 변경됨
- **해결**: 스냅샷 직후 즉시 사용하거나, 클릭 전 스냅샷 재확인

### 2. **타이밍 문제**
- **원인**: 요소가 아직 렌더링되지 않았거나, 페이지 전환이 완료되지 않음
- **해결**: `browser_wait_for`로 적절한 대기 시간 확보

### 3. **요소 상태 문제**
- **원인**: 요소가 `disabled` 상태이거나 다른 요소에 가려져 있음
- **해결**: `browser_evaluate`로 요소 상태 확인 후 클릭

### 4. **접근성 트리 한계**
- **원인**: `absolute`/`fixed` 포지셔닝된 요소가 접근성 트리에 포함되지 않음
- **해결**: `browser_evaluate`로 DOM 직접 확인

### 5. **비동기 작업 미완료**
- **원인**: API 호출이나 상태 업데이트가 완료되기 전에 클릭 시도
- **해결**: 관련 작업 완료를 확인하는 조건부 대기 사용

### 6. **브라우저 창 최소화/숨김 상태**
- **원인**: 브라우저 창이 최소화되거나 다른 창에 가려져 있으면 일부 렌더링이 중단될 수 있음
- **해결**: 브라우저 창이 보이는 상태에서 테스트하거나, 창 상태를 확인하는 로직 추가

## 권장 클릭 패턴

```typescript
// 안정적인 클릭 패턴
async function safeClick(elementDescription: string, waitText?: string) {
  // 1. 페이지 로드 대기 (필요한 경우)
  if (waitText) {
    browser_wait_for({ text: waitText })
  }
  
  // 2. 최신 스냅샷 찍기
  const snapshot = browser_snapshot()
  
  // 3. 요소 ref 찾기
  const ref = findRefInSnapshot(snapshot, elementDescription)
  
  // 4. 요소 상태 확인 (선택사항)
  const elementInfo = browser_evaluate(() => {
    const button = Array.from(document.querySelectorAll('button')).find(
      btn => btn.textContent?.includes(elementDescription)
    );
    return {
      exists: !!button,
      disabled: button?.disabled || false,
      visible: button?.offsetParent !== null
    };
  })
  
  // 5. 상태 확인 후 클릭
  if (elementInfo.exists && !elementInfo.disabled && elementInfo.visible) {
    browser_click({ element: elementDescription, ref })
  } else {
    throw new Error(`Element ${elementDescription} is not clickable`)
  }
  
  // 6. 클릭 후 결과 대기
  browser_wait_for({ time: 1 })
}
```

## 브라우저 창 상태 확인 및 대응

### 문제 6: 브라우저 창이 최소화되거나 숨겨진 상태

**증상**:
- 스냅샷은 정상적으로 찍히지만 일부 요소가 누락됨
- Canvas/WebGL 요소가 렌더링되지 않음
- 클릭은 작동하지만 시각적 피드백이 없음

**원인 분석**:
1. **렌더링 최적화**: 브라우저가 최소화 상태에서 렌더링을 중단하거나 느리게 함
2. **Canvas/WebGL 중단**: 최소화 상태에서 GPU 렌더링이 중단됨
3. **접근성 트리 업데이트 지연**: 일부 요소의 접근성 정보가 업데이트되지 않을 수 있음

**해결 방법**:
```typescript
// 브라우저 창 상태 확인
browser_evaluate(() => {
  return {
    windowVisible: !document.hidden,
    visibilityState: document.visibilityState,
    windowFocused: document.hasFocus()
  };
})

// 창이 숨겨져 있으면 경고
if (windowState.visibilityState === 'hidden') {
  console.warn('브라우저 창이 숨겨져 있습니다. 테스트가 불안정할 수 있습니다.');
}

// 권장: 브라우저 창이 보이는 상태에서 테스트
// - 브라우저 창을 최소화하지 않음
// - 다른 창에 가려지지 않도록 함
// - 필요시 브라우저 창을 포커스함
```

**실제 테스트 결과**:
- ✅ 접근성 트리 기반 스냅샷: 최소화 상태에서도 작동 가능 (일부 제한)
- ✅ DOM 조작 (`browser_evaluate`): 최소화 상태에서도 정상 작동
- ⚠️ Canvas/WebGL 렌더링: 최소화 상태에서 중단될 수 있음
- ⚠️ 시각적 확인: 최소화 상태에서는 불가능

**권장 사항**:
1. **테스트 시 브라우저 창을 보이는 상태로 유지**
   - 최소화하지 않음
   - 다른 창에 가려지지 않도록 함
2. **창 상태 확인 로직 추가** (선택사항)
   ```typescript
   const windowState = browser_evaluate(() => ({
     hidden: document.hidden,
     visibilityState: document.visibilityState
   }));
   
   if (windowState.hidden) {
     console.warn('브라우저 창이 숨겨져 있습니다.');
   }
   ```
3. **Canvas 요소가 필요한 경우**: 창이 보이는 상태에서만 테스트

## 결론

브라우저 자동화 문제는 주로 **타이밍 문제**와 **접근성 트리 한계**, **ref 변경**에서 발생합니다. 이를 해결하기 위해:

1. **스냅샷 직후 즉시 사용**: ref가 변경되기 전에 사용
2. **조건부 대기 사용**: `browser_wait_for`로 적절한 대기 시간 확보
3. **JavaScript로 DOM 직접 확인**: `browser_evaluate`로 요소 상태 확인
4. **스냅샷을 최신 상태로 유지**: 클릭 전 스냅샷 재확인
5. **서버 상태 사전 확인**: 서버가 정상 실행 중인지 확인
6. **에러 처리 및 재시도 로직 추가**: 실패 시 재시도
7. **브라우저 창 상태 확인**: 창이 보이는 상태에서 테스트 (최소화하지 않음)

이러한 개선 사항을 적용하면 브라우저 자동화 테스트의 안정성을 크게 향상시킬 수 있습니다.

### 추가 참고사항: 브라우저 창 최소화

**질문**: 스냅샷을 찍을 때 화면에 항상 게임 화면이 출력되어 있었어야 하나? 화면이 최소화된 상태이면 문제가 생기나?

**답변**:
- **접근성 트리 기반 스냅샷**: 최소화 상태에서도 작동하지만, 일부 요소가 누락될 수 있음
- **Canvas/WebGL 요소**: 최소화 상태에서 렌더링이 중단되어 접근성 트리에 포함되지 않을 수 있음
- **DOM 조작**: 최소화 상태에서도 정상 작동
- **권장**: 테스트 시 브라우저 창을 보이는 상태로 유지하는 것이 가장 안정적

