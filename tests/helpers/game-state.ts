import type { GameSession } from '@shared/schema';

/**
 * 게임 상태 스냅샷
 * Cursor가 게임 상태를 이해할 수 있도록 구조화된 정보
 */
export interface GameStateSnapshot {
  timestamp: Date;
  gameId: string;
  stage: number;
  round: number;
  health: number;
  maxHealth: number;
  gold: number;
  score: number;
  gameState: string;
  enemyHp: number;
  maxEnemyHp: number;
  enemyDamage: number;
  rerollsLeft: number;
  dicesCount: number;
  jokersCount: number;
  consumablesCount: number;
  vouchersCount: number;
}

/**
 * 게임 상태를 스냅샷으로 변환
 */
export function captureGameState(game: GameSession): GameStateSnapshot {
  return {
    timestamp: new Date(),
    gameId: game.id,
    stage: game.currentStage,
    round: game.currentRound,
    health: game.health,
    maxHealth: game.maxHealth,
    gold: game.gold,
    score: game.score,
    gameState: game.gameState,
    enemyHp: game.enemyHp,
    maxEnemyHp: game.maxEnemyHp,
    enemyDamage: game.enemyDamage,
    rerollsLeft: game.rerollsLeft,
    dicesCount: Array.isArray(game.dices) ? game.dices.length : 0,
    jokersCount: Array.isArray(game.jokers) ? game.jokers.length : 0,
    consumablesCount: Array.isArray(game.consumables) ? game.consumables.length : 0,
    vouchersCount: Array.isArray(game.vouchers) ? game.vouchers.length : 0,
  };
}

/**
 * 게임 상태를 읽기 쉬운 형식으로 출력
 */
export function formatGameState(game: GameSession): string {
  const snapshot = captureGameState(game);
  return `
게임 상태 리포트:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
게임 ID: ${snapshot.gameId}
스테이지: ${snapshot.stage}-${snapshot.round}
게임 상태: ${snapshot.gameState}

플레이어:
  HP: ${snapshot.health}/${snapshot.maxHealth}
  골드: ${snapshot.gold}
  점수: ${snapshot.score}

적:
  HP: ${snapshot.enemyHp}/${snapshot.maxEnemyHp}
  공격력: ${snapshot.enemyDamage}

리소스:
  리롤: ${snapshot.rerollsLeft}
  주사위: ${snapshot.dicesCount}개
  조커: ${snapshot.jokersCount}개
  소모품: ${snapshot.consumablesCount}개
  바우처: ${snapshot.vouchersCount}개
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  `.trim();
}

/**
 * 게임 상태 비교
 */
export function compareGameStates(before: GameSession, after: GameSession): {
  changes: string[];
  warnings: string[];
} {
  const changes: string[] = [];
  const warnings: string[] = [];

  if (before.health !== after.health) {
    const diff = after.health - before.health;
    changes.push(`HP: ${before.health} → ${after.health} (${diff > 0 ? '+' : ''}${diff})`);
    if (after.health <= 0) {
      warnings.push('⚠️ 플레이어 HP가 0 이하입니다! 게임 오버 상태일 수 있습니다.');
    }
  }

  if (before.gold !== after.gold) {
    const diff = after.gold - before.gold;
    changes.push(`골드: ${before.gold} → ${after.gold} (${diff > 0 ? '+' : ''}${diff})`);
  }

  if (before.currentStage !== after.currentStage) {
    changes.push(`스테이지: ${before.currentStage} → ${after.currentStage}`);
  }

  if (before.gameState !== after.gameState) {
    changes.push(`게임 상태: ${before.gameState} → ${after.gameState}`);
  }

  if (before.enemyHp !== after.enemyHp) {
    const diff = after.enemyHp - before.enemyHp;
    changes.push(`적 HP: ${before.enemyHp} → ${after.enemyHp} (${diff > 0 ? '+' : ''}${diff})`);
    if (after.enemyHp <= 0 && after.gameState !== 'shop') {
      warnings.push('⚠️ 적 HP가 0인데 상점으로 이동하지 않았습니다!');
    }
  }

  if (before.rerollsLeft !== after.rerollsLeft) {
    const diff = after.rerollsLeft - before.rerollsLeft;
    changes.push(`리롤: ${before.rerollsLeft} → ${after.rerollsLeft} (${diff > 0 ? '+' : ''}${diff})`);
    if (after.rerollsLeft < 0) {
      warnings.push('⚠️ 리롤이 음수입니다! 버그 가능성.');
    }
  }

  return { changes, warnings };
}

