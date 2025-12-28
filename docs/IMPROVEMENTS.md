# Dice-Balatro 프로젝트 개선안

## 📋 프로젝트 개요
- **프로젝트명**: Dice-Balatro (Yahtzee + Balatro 스타일 로그라이크)
- **기술 스택**: React 19, TypeScript, Express, PostgreSQL, Drizzle ORM, Three.js
- **주요 기능**: 3D 물리 주사위, 전투 시스템, 상점, 스테이지 선택

---

## 🔴 긴급 개선 사항 (High Priority)

### 1. 에러 처리 개선
**현재 문제점:**
- API 라우트에서 일관성 없는 에러 처리
- 클라이언트에서 에러 메시지가 사용자에게 제대로 표시되지 않음
- Zod 검증 에러가 제대로 처리되지 않음

**개선안:**
```typescript
// server/middleware/errorHandler.ts 생성
export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public code?: string
  ) {
    super(message);
  }
}

export function errorHandler(
  err: any,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      code: err.code,
    });
  }
  
  if (err instanceof z.ZodError) {
    return res.status(400).json({
      error: 'Validation failed',
      details: err.errors,
    });
  }
  
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
  });
}
```

### 2. 타입 안정성 개선
**현재 문제점:**
- `routes.ts`에서 `as any` 다수 사용
- JSONB 타입이 제대로 타입 체크되지 않음

**개선안:**
```typescript
// shared/schema.ts에 타입 가드 추가
export function isDiceArray(value: unknown): value is Dice[] {
  return Array.isArray(value) && value.every(diceSchema.safeParse);
}

// routes.ts에서 사용
const dices = isDiceArray(session.dices) 
  ? session.dices 
  : createInitialDices();
```

### 3. 입력 검증 강화
**현재 문제점:**
- 클라이언트에서 보낸 데이터 검증이 부족
- SQL Injection 방어는 ORM으로 해결되지만, 비즈니스 로직 검증 부족

**개선안:**
```typescript
// server/validators/gameValidators.ts 생성
export const rollDiceSchema = z.object({
  lockedDices: z.array(z.object({
    id: z.number().int().min(0).max(4),
    value: z.number().int().min(1).max(6),
  })).max(5),
});

export const submitHandSchema = z.object({
  damage: z.number().int().min(0).max(10000),
});
```

---

## 🟡 중요 개선 사항 (Medium Priority)

### 4. API 라우트 구조 개선
**현재 문제점:**
- 모든 라우트가 `routes.ts` 하나에 집중
- 라우트가 길어져 유지보수 어려움

**개선안:**
```
server/
  routes/
    index.ts          # 라우트 등록
    games.ts          # 게임 관련 라우트
    shop.ts           # 상점 관련 라우트
    stages.ts         # 스테이지 관련 라우트
  controllers/
    gameController.ts
    shopController.ts
  services/
    gameService.ts
    shopService.ts
```

### 5. React Query 활용 개선
**현재 문제점:**
- React Query가 설치되어 있지만 제대로 활용되지 않음
- 각 컴포넌트에서 직접 fetch 사용

**개선안:**
```typescript
// client/src/hooks/useGameSession.ts
export function useGameSession(id: string) {
  return useQuery({
    queryKey: ['game', id],
    queryFn: () => fetch(`/api/games/${id}`).then(r => r.json()),
    staleTime: 1000, // 1초
  });
}

export function useRollDice() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: ({ gameId, lockedDices }: RollDiceParams) =>
      fetch(`/api/games/${gameId}/roll`, {
        method: 'POST',
        body: JSON.stringify({ lockedDices }),
      }).then(r => r.json()),
    onSuccess: (data, variables) => {
      queryClient.setQueryData(['game', variables.gameId], data);
    },
  });
}
```

### 6. 코드 중복 제거
**현재 문제점:**
- `getStageStats` 함수가 `routes.ts`와 `StageSelectPage.tsx`에 중복
- 주사위 생성 로직이 여러 곳에 분산

**개선안:**
```typescript
// shared/gameLogic.ts 생성
export function getStageStats(stage: number) {
  const baseHp = 100;
  const baseReward = 3;
  const stageMultiplier = 1 + (stage - 1) * 0.5;
  
  return {
    enemyHp: Math.round(baseHp * stageMultiplier),
    goldReward: Math.round(baseReward * stageMultiplier),
    enemyDamage: Math.round(10 + (stage - 1) * 2),
  };
}

export function createInitialDices(): Dice[] {
  const FIXED_SUITS = ['None', '♠', '♦', '♥', '♣'];
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 6) + 1,
    suit: FIXED_SUITS[i] as Dice['suit'],
    locked: false,
  }));
}
```

### 7. 성능 최적화
**현재 문제점:**
- `GameScreen.tsx`에서 불필요한 리렌더링 가능성
- 3D 주사위 컴포넌트가 매번 재생성될 수 있음

**개선안:**
```typescript
// useMemo와 useCallback 적절히 활용
const lockedDices = useMemo(
  () => dices.filter(d => d.locked),
  [dices]
);

// React.memo로 Dice 컴포넌트 최적화
const Dice = React.memo(({ id, value, suit, isLocked, ... }: DiceProps) => {
  // ...
});
```

---

## 🟢 추가 개선 사항 (Low Priority)

### 8. 테스트 코드 추가
**현재 문제점:**
- 테스트 코드가 전혀 없음

**개선안:**
```typescript
// server/__tests__/gameLogic.test.ts
describe('getStageStats', () => {
  it('should calculate correct stats for stage 1', () => {
    const stats = getStageStats(1);
    expect(stats.enemyHp).toBe(100);
    expect(stats.enemyDamage).toBe(10);
  });
  
  it('should scale stats for higher stages', () => {
    const stats = getStageStats(5);
    expect(stats.enemyHp).toBeGreaterThan(100);
  });
});
```

### 9. 환경 변수 관리
**현재 문제점:**
- 환경 변수 검증이 런타임에만 이루어짐

**개선안:**
```typescript
// server/config/env.ts
import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().url(),
  PORT: z.string().regex(/^\d+$/).transform(Number).default('5000'),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
});

export const env = envSchema.parse(process.env);
```

### 10. 로깅 개선
**현재 문제점:**
- 단순 console.log 사용
- 프로덕션 환경에서 로그 레벨 관리 불가

**개선안:**
```typescript
// server/utils/logger.ts
import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console({
      format: winston.format.simple(),
    }),
  ],
});
```

### 11. API 문서화
**개선안:**
- Swagger/OpenAPI 추가
- 또는 간단한 README에 API 엔드포인트 문서화

### 12. 데이터베이스 마이그레이션 관리
**현재 문제점:**
- 마이그레이션 파일이 보이지 않음
- `drizzle-kit push`만 사용 중

**개선안:**
```bash
# drizzle-kit generate로 마이그레이션 생성
npm run db:generate
npm run db:migrate
```

### 13. 게임 밸런스 설정 분리
**현재 문제점:**
- 게임 밸런스 값이 코드에 하드코딩

**개선안:**
```typescript
// shared/gameConfig.ts
export const GAME_CONFIG = {
  INITIAL_HEALTH: 100,
  INITIAL_GOLD: 0,
  INITIAL_REROLLS: 3,
  BASE_ENEMY_HP: 100,
  BASE_ENEMY_DAMAGE: 10,
  BASE_GOLD_REWARD: 3,
  STAGE_MULTIPLIER: 0.5,
  HAND_MULTIPLIERS: {
    Yahtzee: 30,
    'Straight Flush': 50,
    // ...
  },
} as const;
```

### 14. 접근성 개선
**개선안:**
- 키보드 네비게이션 지원
- ARIA 레이블 추가
- 색상 대비 개선

### 15. 모바일 최적화
**현재 문제점:**
- 모바일에서 3D 주사위 조작이 어려울 수 있음

**개선안:**
- 터치 제스처 개선
- 모바일 UI 레이아웃 조정
- 성능 최적화 (모바일에서 3D 렌더링 부담)

---

## 📊 우선순위별 작업 계획

### Phase 1 (즉시 적용)
1. ✅ 에러 처리 개선
2. ✅ 타입 안정성 개선
3. ✅ 입력 검증 강화

### Phase 2 (1-2주 내)
4. ✅ API 라우트 구조 개선
5. ✅ React Query 활용 개선
6. ✅ 코드 중복 제거

### Phase 3 (장기)
7. ✅ 성능 최적화
8. ✅ 테스트 코드 추가
9. ✅ 로깅 개선
10. ✅ API 문서화

---

## 🎯 예상 효과

- **코드 품질**: 타입 안정성 향상, 버그 감소
- **유지보수성**: 구조 개선으로 코드 이해도 향상
- **사용자 경험**: 에러 처리 개선으로 더 나은 피드백
- **개발 속도**: React Query 활용으로 상태 관리 간소화
- **안정성**: 테스트 코드로 리그레션 방지

---

## 📝 참고사항

- 모든 개선안은 점진적으로 적용 가능
- 기존 기능을 깨뜨리지 않으면서 개선
- 각 개선안은 독립적으로 적용 가능

