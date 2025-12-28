# 테스트 아키텍처 설계

## 📋 테스트 구조 개요

### 1. 테스트 계층 구조

```
테스트 피라미드
    /\
   /  \      E2E 테스트 (소수)
  /____\     - 전체 게임 플레이 흐름
 /      \    
/________\   통합 테스트 (중간)
            - API 엔드포인트 테스트
            - 스토리지 연동 테스트
            
단위 테스트 (다수)
- 비즈니스 로직 테스트
- 유틸리티 함수 테스트
- 검증 스키마 테스트
```

## 🎯 테스트 프레임워크 선택

### 추천: **Vitest**
- ✅ Vite 프로젝트와 완벽 통합
- ✅ 빠른 실행 속도
- ✅ TypeScript 네이티브 지원
- ✅ Jest와 유사한 API (학습 곡선 낮음)
- ✅ ESM 모듈 지원

### 대안: Jest
- 널리 사용되지만 설정이 복잡할 수 있음
- ESM 지원이 Vitest보다 복잡

## 📁 테스트 파일 구조

```
Dice-Balatro/
├── server/
│   ├── __tests__/              # 서버 단위 테스트
│   │   ├── utils/
│   │   │   └── gameLogic.test.ts    # 게임 로직 테스트
│   │   ├── validators/
│   │   │   └── gameValidators.test.ts  # 검증 스키마 테스트
│   │   └── storage/
│   │       ├── memory.test.ts        # 메모리 스토리지 테스트
│   │       └── database.test.ts      # 데이터베이스 스토리지 테스트
│   │
│   ├── __integration__/        # 통합 테스트
│   │   ├── api/
│   │   │   ├── games.test.ts         # 게임 API 테스트
│   │   │   ├── shop.test.ts          # 상점 API 테스트
│   │   │   └── stages.test.ts        # 스테이지 API 테스트
│   │   └── routes.test.ts            # 전체 라우트 통합 테스트
│   │
│   └── __e2e__/               # E2E 테스트
│       └── game-flow.test.ts         # 전체 게임 플레이 흐름
│
├── shared/
│   └── __tests__/
│       └── schema.test.ts            # 스키마 타입 가드 테스트
│
└── tests/                      # 공통 테스트 유틸리티
    ├── setup.ts                # 테스트 설정
    ├── fixtures.ts             # 테스트 데이터
    └── helpers.ts               # 테스트 헬퍼 함수
```

## 🔧 테스트 유형별 상세 설계

### 1. 단위 테스트 (Unit Tests)

#### 목적
- 개별 함수/클래스의 동작 검증
- 비즈니스 로직의 정확성 확인
- 빠른 실행 속도

#### 예시: `server/__tests__/utils/gameLogic.test.ts`
```typescript
describe('getStageStats', () => {
  it('스테이지 1의 기본 스탯을 반환해야 함', () => {
    const stats = getStageStats(1);
    expect(stats.enemyHp).toBe(100);
    expect(stats.enemyDamage).toBe(10);
    expect(stats.goldReward).toBe(3);
  });

  it('스테이지가 올라갈수록 스탯이 증가해야 함', () => {
    const stage1 = getStageStats(1);
    const stage5 = getStageStats(5);
    
    expect(stage5.enemyHp).toBeGreaterThan(stage1.enemyHp);
    expect(stage5.enemyDamage).toBeGreaterThan(stage1.enemyDamage);
  });
});

describe('createInitialDices', () => {
  it('5개의 주사위를 생성해야 함', () => {
    const dices = createInitialDices();
    expect(dices).toHaveLength(5);
  });

  it('각 주사위는 올바른 형식이어야 함', () => {
    const dices = createInitialDices();
    dices.forEach(dice => {
      expect(dice).toHaveProperty('id');
      expect(dice).toHaveProperty('value');
      expect(dice.value).toBeGreaterThanOrEqual(1);
      expect(dice.value).toBeLessThanOrEqual(6);
      expect(dice).toHaveProperty('suit');
      expect(dice).toHaveProperty('locked');
      expect(dice.locked).toBe(false);
    });
  });
});
```

#### 예시: `server/__tests__/validators/gameValidators.test.ts`
```typescript
describe('rollDiceSchema', () => {
  it('유효한 lockedDices 배열을 허용해야 함', () => {
    const valid = { lockedDices: [{ id: 0, value: 3 }] };
    expect(() => rollDiceSchema.parse(valid)).not.toThrow();
  });

  it('잘못된 id 범위를 거부해야 함', () => {
    const invalid = { lockedDices: [{ id: 10, value: 3 }] };
    expect(() => rollDiceSchema.parse(invalid)).toThrow();
  });

  it('잘못된 value 범위를 거부해야 함', () => {
    const invalid = { lockedDices: [{ id: 0, value: 10 }] };
    expect(() => rollDiceSchema.parse(invalid)).toThrow();
  });
});
```

### 2. 통합 테스트 (Integration Tests)

#### 목적
- API 엔드포인트의 전체 흐름 검증
- 스토리지와의 연동 확인
- 에러 처리 검증

#### 예시: `server/__integration__/api/games.test.ts`
```typescript
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createTestServer } from '../../helpers/test-server';

describe('POST /api/games/new', () => {
  let app: Express;

  beforeAll(() => {
    app = createTestServer();
  });

  it('새 게임을 생성해야 함', async () => {
    const response = await request(app)
      .post('/api/games/new')
      .expect(200);

    expect(response.body).toHaveProperty('id');
    expect(response.body.health).toBe(100);
    expect(response.body.gameState).toBe('stage_select');
    expect(response.body.dices).toHaveLength(5);
  });
});

describe('POST /api/games/:id/roll', () => {
  let app: Express;
  let gameId: string;

  beforeAll(async () => {
    app = createTestServer();
    const newGame = await request(app).post('/api/games/new');
    gameId = newGame.body.id;
  });

  it('주사위를 굴려야 함', async () => {
    const response = await request(app)
      .post(`/api/games/${gameId}/roll`)
      .send({ lockedDices: [] })
      .expect(200);

    expect(response.body.rerollsLeft).toBe(2); // 3에서 1 감소
  });

  it('리롤이 없으면 에러를 반환해야 함', async () => {
    // 리롤을 모두 소진
    await request(app).post(`/api/games/${gameId}/roll`).send({ lockedDices: [] });
    await request(app).post(`/api/games/${gameId}/roll`).send({ lockedDices: [] });
    await request(app).post(`/api/games/${gameId}/roll`).send({ lockedDices: [] });

    const response = await request(app)
      .post(`/api/games/${gameId}/roll`)
      .send({ lockedDices: [] })
      .expect(400);

    expect(response.body.error).toBe('No rerolls left');
    expect(response.body.code).toBe('NO_REROLLS_LEFT');
  });

  it('잘못된 입력을 거부해야 함', async () => {
    const response = await request(app)
      .post(`/api/games/${gameId}/roll`)
      .send({ lockedDices: [{ id: 10, value: 3 }] }) // 잘못된 id
      .expect(400);

    expect(response.body.error).toBe('Validation failed');
  });
});

describe('POST /api/games/:id/submit', () => {
  it('데미지를 적용하고 게임 상태를 업데이트해야 함', async () => {
    // 게임 생성 -> 주사위 굴리기 -> 핸드 제출 시나리오
  });

  it('적을 처치하면 상점으로 이동해야 함', async () => {
    // 적 HP를 0으로 만드는 시나리오
  });

  it('플레이어 HP가 0이면 게임 오버해야 함', async () => {
    // 플레이어 HP를 0으로 만드는 시나리오
  });
});
```

### 3. E2E 테스트 (End-to-End Tests)

#### 목적
- 전체 게임 플레이 흐름 검증
- 사용자 시나리오 테스트
- 실제 게임 로직 검증

#### 예시: `server/__e2e__/game-flow.test.ts`
```typescript
describe('전체 게임 플레이 흐름', () => {
  it('게임 시작부터 상점까지의 전체 흐름', async () => {
    // 1. 게임 생성
    const newGame = await request(app).post('/api/games/new');
    const gameId = newGame.body.id;

    // 2. 스테이지 선택
    await request(app)
      .post(`/api/games/${gameId}/next-stage`)
      .send({ stageChoice: 'easy' });

    // 3. 주사위 굴리기
    await request(app)
      .post(`/api/games/${gameId}/roll`)
      .send({ lockedDices: [] });

    // 4. 핸드 제출 (적 처치)
    await request(app)
      .post(`/api/games/${gameId}/submit`)
      .send({ damage: 1000 }); // 큰 데미지로 적 처치

    // 5. 상점 확인
    const gameState = await request(app).get(`/api/games/${gameId}`);
    expect(gameState.body.gameState).toBe('shop');
    expect(gameState.body.gold).toBeGreaterThan(0);

    // 6. 상점에서 아이템 구매
    await request(app)
      .post(`/api/games/${gameId}/shop/buy`)
      .send({
        itemType: 'joker',
        item: { id: 'joker_1', name: 'Lucky Joker', ... },
        cost: 5
      });

    // 7. 상점 나가기
    await request(app).post(`/api/games/${gameId}/shop/exit`);
    
    const finalState = await request(app).get(`/api/games/${gameId}`);
    expect(finalState.body.gameState).toBe('stage_select');
  });
});
```

## 🛠️ 테스트 도구 및 설정

### 필요한 패키지
```json
{
  "devDependencies": {
    "vitest": "^1.0.0",
    "@vitest/ui": "^1.0.0",
    "supertest": "^6.3.0",
    "@types/supertest": "^2.0.16"
  }
}
```

### Vitest 설정 (`vitest.config.ts`)
```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['**/__tests__/**/*.test.ts', '**/__integration__/**/*.test.ts', '**/__e2e__/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: ['node_modules/', 'dist/', '**/*.test.ts']
    }
  }
});
```

## 📊 테스트 실행 전략

### 1. 개발 중 테스트
```bash
# 감시 모드로 테스트 실행 (파일 변경 시 자동 재실행)
npm run test:watch

# 특정 테스트만 실행
npm run test -- games.test.ts
```

### 2. CI/CD 파이프라인
```bash
# 모든 테스트 실행
npm run test

# 커버리지 포함
npm run test:coverage
```

### 3. 테스트 스크립트 (`package.json`)
```json
{
  "scripts": {
    "test": "vitest run",
    "test:watch": "vitest",
    "test:ui": "vitest --ui",
    "test:coverage": "vitest run --coverage",
    "test:unit": "vitest run __tests__",
    "test:integration": "vitest run __integration__",
    "test:e2e": "vitest run __e2e__"
  }
}
```

## 🎯 테스트 커버리지 목표

- **단위 테스트**: 80% 이상
- **통합 테스트**: 주요 API 엔드포인트 100%
- **E2E 테스트**: 핵심 사용자 시나리오 100%

## 🔄 테스트 실행 흐름

```
1. 단위 테스트 실행 (빠름, ~5초)
   ↓
2. 통합 테스트 실행 (중간, ~30초)
   ↓
3. E2E 테스트 실행 (느림, ~2분)
   ↓
4. 커버리지 리포트 생성
```

## 📝 테스트 작성 원칙

1. **AAA 패턴**: Arrange, Act, Assert
2. **독립성**: 각 테스트는 독립적으로 실행 가능해야 함
3. **명확한 이름**: 테스트 이름만 봐도 무엇을 테스트하는지 알 수 있어야 함
4. **빠른 실행**: 단위 테스트는 매우 빠르게 실행되어야 함
5. **실제 시나리오**: 실제 사용자 시나리오를 반영

## 🚀 다음 단계

이 구조를 바탕으로:
1. Vitest 설치 및 설정
2. 테스트 헬퍼 함수 작성
3. 단위 테스트부터 시작
4. 통합 테스트 추가
5. E2E 테스트 마지막

이 구조로 진행하면 체계적이고 유지보수 가능한 테스트를 구축할 수 있습니다.

