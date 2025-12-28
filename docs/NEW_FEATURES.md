# 새로 추가된 발라트로 피처

## ✅ 구현 완료된 기능

### 1. 족보 업그레이드 기능 ⭐
**발라트로의 행성 카드 시스템**

- **기능**: 행성 카드를 사용하여 특정 족보의 multiplier를 영구적으로 증가
- **API**: `POST /api/games/:id/upgrade-hand`
- **UI**: `HandUpgradeModal` 컴포넌트
- **사용 방법**:
  1. 게임 화면 우측 상단의 ✨ 버튼 클릭
  2. 업그레이드할 족보 선택
  3. 사용 가능한 행성 카드 중 하나 선택
  4. 족보의 multiplier가 영구적으로 증가

**구현 세부사항**:
- `handUpgrades` 필드에 족보별 multiplier 보너스 저장
- 행성 카드 사용 시 소모품에서 제거
- 데미지 계산 시 업그레이드 보너스 자동 적용

### 2. 주사위 인챈트 기능 ⭐
**소모품으로 주사위 변경**

- **기능**: 소모품(타로 카드 등)을 사용하여 주사위의 값 또는 슈트 변경
- **API**: `POST /api/games/:id/enchant-dice`
- **UI**: `DiceEnchantModal` 컴포넌트
- **옵션**:
  - **대상**: 윗면만 (`top`) 또는 모든 면 (`all`)
  - **변경 타입**: 값만 (`value`), 슈트만 (`suit`), 둘 다 (`both`)

**사용 방법**:
1. 게임 화면 우측 상단의 🪄 버튼 클릭
2. 소모품 선택
3. 대상 선택 (윗면만/모든 면)
4. 변경 타입 선택
5. 새 값/슈트 선택
6. 인챈트 실행

### 3. 주사위 리스트 기능 ⭐
**보유 주사위 확인**

- **기능**: 현재 보유한 모든 주사위를 확인할 수 있는 팝업
- **UI**: `DiceListModal` 컴포넌트
- **사용 방법**:
  1. 게임 화면 우측 상단의 📋 버튼 클릭
  2. 모든 주사위의 값, 슈트, 잠금 상태 확인

## 📁 생성된 파일

### 스키마 및 타입
- `shared/types.ts`: 게임 관련 타입 정의
- `shared/schema.ts`: `handUpgrades` 필드 추가

### API
- `server/validators/gameValidators.ts`: 
  - `upgradeHandSchema` 추가
  - `enchantDiceSchema` 추가
- `server/routes.ts`:
  - `POST /api/games/:id/upgrade-hand` 엔드포인트
  - `POST /api/games/:id/enchant-dice` 엔드포인트

### UI 컴포넌트
- `client/src/components/DiceListModal.tsx`: 주사위 리스트 모달
- `client/src/components/HandUpgradeModal.tsx`: 족보 업그레이드 모달
- `client/src/components/DiceEnchantModal.tsx`: 주사위 인챈트 모달

### 수정된 파일
- `client/src/pages/GameScreen.tsx`:
  - 모달 상태 관리 추가
  - 족보 업그레이드 보너스 계산에 반영
  - 액션 버튼 추가 (우측 상단)

## 🎮 사용 예시

### 족보 업그레이드
```typescript
// 행성 카드 "Mercury" (Pair 족보용) 사용
POST /api/games/{id}/upgrade-hand
{
  "planetCardId": "mercury",
  "handName": "Pair"
}

// 결과: Pair 족보의 multiplier가 +1 증가
```

### 주사위 인챈트
```typescript
// 소모품으로 주사위 #0의 값을 6으로 변경
POST /api/games/{id}/enchant-dice
{
  "consumableId": "the_magician_i",
  "diceId": 0,
  "target": "top",
  "enchantType": "value",
  "newValue": 6
}
```

## 🔧 기술적 세부사항

### 족보 업그레이드
- 행성 카드의 `addition` 필드에서 multiplier 증가량 추출
- 예: "+1 Mult" → multiplier +1
- 여러 번 사용 가능 (누적)

### 주사위 인챈트
- 윗면만 변경: 특정 주사위의 `value` 또는 `suit`만 변경
- 모든 면 변경: 모든 주사위의 값/슈트 변경
- 소모품 사용 후 자동 제거

### 주사위 리스트
- 현재 `dices` 배열의 모든 주사위 표시
- 값, 슈트, 잠금 상태 표시

## 🚀 다음 단계

1. **테스트**: 각 기능의 동작 확인
2. **UI 개선**: 모달 디자인 개선
3. **에러 처리**: 사용자 친화적인 에러 메시지
4. **애니메이션**: 인챈트 효과 애니메이션 추가

## 📝 참고

- 발라트로 벤치마킹 데이터베이스: `benchmark/` 폴더
- 행성 카드 데이터: `benchmark/balatro-planets-db.ts`
- 타로 카드 데이터: `benchmark/balatro-tarots-db.ts`

