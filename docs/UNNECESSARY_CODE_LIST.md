# 불필요한 코드 리스트

클라이언트에서 실제 주사위 값이 결정되므로 서버에서 임시/초기값을 설정하는 코드들은 불필요할 수 있습니다.

## 1. `createInitialDices()` 함수 (완전히 미사용)

**위치**: `server/routes.ts:67-74`

**설명**: 랜덤 주사위 값을 생성하는 함수. 더 이상 사용되지 않음.

**코드**:
```typescript
function createInitialDices(): Dice[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 6) + 1,
    suit: FIXED_SUITS[i] as Dice['suit'],
    locked: false,
  }));
}
```

**사용처**: 없음 (이미 `createDicesFromDeck`으로 대체됨)

**제거 가능 여부**: ✅ 완전히 제거 가능

---

## 2. `createDicesFromDeck()` 함수 (임시값 생성)

**위치**: `server/routes.ts:54-65`

**설명**: 덱의 `currentTopFace`를 기반으로 주사위 값을 생성. 하지만 클라이언트에서 실제 값이 결정되므로 임시값일 뿐.

**코드**:
```typescript
function createDicesFromDeck(deck: DeckDice[]): Dice[] {
  return deck.map(d => {
    const topFace = d.faces[d.currentTopFace];
    return {
      id: d.id,
      value: topFace.value,
      suit: topFace.suit,
      locked: false,
    };
  });
}
```

**사용처**:
- 새 게임 시작 (`/api/games/new`) - line 84
- 주사위 굴리기 (`/api/games/:id/roll`) - line 170
- 핸드 제출 (`/api/games/:id/submit`) - line 219
- 다음 스테이지 (`/api/games/:id/next-stage`) - line 268

**제거 가능 여부**: ⚠️ 제거 시 빈 배열 `[]` 또는 기본 구조만 반환하도록 변경 필요

---

## 3. 새 게임 시작 시 임시 주사위 값 설정

**위치**: `server/routes.ts:82-84`

**설명**: `createDicesFromDeck(initialDiceDeck)`로 초기 주사위 값을 설정하지만, 클라이언트에서 첫 번째 굴리기 후 덮어씌워짐.

**코드**:
```typescript
const initialDiceDeck = createInitialDiceDeck();
const initialDices = createDicesFromDeck(initialDiceDeck);
```

**제거 가능 여부**: ⚠️ 제거 시 빈 배열 `[]`로 시작하거나 기본 구조만 설정

---

## 4. 주사위 굴리기 시 임시 주사위 값 설정

**위치**: `server/routes.ts:166-170`

**설명**: 덱이 비어있을 때 `createDicesFromDeck(newDeck)`로 주사위 값을 설정하지만, 클라이언트에서 물리 시뮬레이션 후 덮어씌워짐.

**코드**:
```typescript
if (currentDices.length === 0 || currentDeck.length === 0) {
  newDeck = createInitialDiceDeck();
  newDices = createDicesFromDeck(newDeck);
}
```

**제거 가능 여부**: ⚠️ 제거 시 빈 배열 `[]`로 시작하거나 기존 `currentDices` 유지

---

## 5. 핸드 제출 시 임시 주사위 값 설정

**위치**: `server/routes.ts:214-219`

**설명**: 새로운 라운드 시작 시 `createDicesFromDeck(newDeck)`로 주사위 값을 설정하지만, 클라이언트에서 첫 번째 굴리기 후 덮어씌워짐.

**코드**:
```typescript
const newDeck = currentDeck.length > 0 
  ? currentDeck.map(d => ({ ...d, currentTopFace: 0 }))
  : createInitialDiceDeck();
const newDices = createDicesFromDeck(newDeck);
```

**제거 가능 여부**: ⚠️ 제거 시 빈 배열 `[]`로 시작

---

## 6. 다음 스테이지 이동 시 임시 주사위 값 설정

**위치**: `server/routes.ts:263-268`

**설명**: 새로운 스테이지 시작 시 `createDicesFromDeck(newDeck)`로 주사위 값을 설정하지만, 클라이언트에서 첫 번째 굴리기 후 덮어씌워짐.

**코드**:
```typescript
const newDeck = currentDeck.length > 0
  ? currentDeck.map(d => ({ ...d, currentTopFace: 0 }))
  : createInitialDiceDeck();
const newDices = createDicesFromDeck(newDeck);
```

**제거 가능 여부**: ⚠️ 제거 시 빈 배열 `[]`로 시작

---

## 요약

| 항목 | 제거 가능 여부 | 영향도 | 권장 사항 |
|------|---------------|--------|----------|
| `createInitialDices()` 함수 | ✅ 완전 제거 가능 | 낮음 | 제거 권장 |
| `createDicesFromDeck()` 함수 | ⚠️ 조건부 제거 | 중간 | 빈 배열 반환으로 변경 또는 제거 |
| 새 게임 시작 시 임시값 | ⚠️ 조건부 제거 | 중간 | 빈 배열로 시작 |
| 주사위 굴리기 시 임시값 | ⚠️ 조건부 제거 | 중간 | 기존 값 유지 또는 빈 배열 |
| 핸드 제출 시 임시값 | ⚠️ 조건부 제거 | 중간 | 빈 배열로 시작 |
| 다음 스테이지 시 임시값 | ⚠️ 조건부 제거 | 중간 | 빈 배열로 시작 |

## 참고사항

- 클라이언트에서 주사위 값을 항상 설정하므로, 서버의 임시값은 초기 로딩 시에만 보일 수 있습니다.
- 빈 배열로 시작하면 클라이언트에서 주사위를 굴릴 때까지 주사위가 표시되지 않을 수 있습니다.
- 기본 구조(id, value, suit, locked)만 있는 빈 배열을 반환하는 것이 안전할 수 있습니다.

