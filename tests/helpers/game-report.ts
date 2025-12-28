import type { GameSession } from '@shared/schema';
import { captureGameState, formatGameState } from './game-state';

/**
 * 게임 플레이 리포트
 * Cursor가 게임 상태를 이해할 수 있도록 구조화된 리포트
 */
export interface GamePlayReport {
  gameId: string;
  startTime: Date;
  endTime: Date;
  duration: number;
  finalStage: number;
  finalHealth: number;
  finalGold: number;
  finalScore: number;
  states: ReturnType<typeof captureGameState>[];
  bugs: BugReport[];
  balanceIssues: BalanceIssue[];
  recommendations: string[];
}

export interface BugReport {
  type: 'error' | 'warning' | 'info';
  message: string;
  gameState?: ReturnType<typeof captureGameState>;
  expected?: string;
  actual?: string;
}

export interface BalanceIssue {
  type: 'difficulty' | 'economy' | 'progression';
  message: string;
  severity: 'low' | 'medium' | 'high';
  recommendation: string;
}

/**
 * 게임 플레이 리포트 생성
 */
export class GameReporter {
  private states: ReturnType<typeof captureGameState>[] = [];
  private bugs: BugReport[] = [];
  private balanceIssues: BalanceIssue[] = [];
  private startTime: Date = new Date();

  /**
   * 게임 상태 기록
   */
  recordState(game: GameSession): void {
    this.states.push(captureGameState(game));
  }

  /**
   * 버그 리포트 추가
   */
  reportBug(bug: BugReport): void {
    this.bugs.push(bug);
  }

  /**
   * 밸런싱 이슈 리포트 추가
   */
  reportBalanceIssue(issue: BalanceIssue): void {
    this.balanceIssues.push(issue);
  }

  /**
   * 최종 리포트 생성
   */
  generateReport(): GamePlayReport {
    const endTime = new Date();
    const duration = endTime.getTime() - this.startTime.getTime();
    const finalState = this.states[this.states.length - 1];

    // 밸런싱 분석
    this.analyzeBalance();

    // 추천 사항 생성
    const recommendations = this.generateRecommendations();

    return {
      gameId: finalState?.gameId || 'unknown',
      startTime: this.startTime,
      endTime,
      duration,
      finalStage: finalState?.stage || 0,
      finalHealth: finalState?.health || 0,
      finalGold: finalState?.gold || 0,
      finalScore: finalState?.score || 0,
      states: this.states,
      bugs: this.bugs,
      balanceIssues: this.balanceIssues,
      recommendations,
    };
  }

  /**
   * 밸런싱 분석
   */
  private analyzeBalance(): void {
    if (this.states.length < 2) return;

    // 스테이지별 적 HP 증가율 분석
    const stageHps = new Map<number, number>();
    this.states.forEach(state => {
      if (state.gameState === 'combat') {
        stageHps.set(state.stage, state.enemyHp);
      }
    });

    const stages = Array.from(stageHps.keys()).sort((a, b) => a - b);
    if (stages.length >= 2) {
      const growthRates: number[] = [];
      for (let i = 1; i < stages.length; i++) {
        const prevHp = stageHps.get(stages[i - 1]) || 0;
        const currHp = stageHps.get(stages[i]) || 0;
        if (prevHp > 0) {
          const growthRate = ((currHp - prevHp) / prevHp) * 100;
          growthRates.push(growthRate);
        }
      }

      const avgGrowth = growthRates.reduce((a, b) => a + b, 0) / growthRates.length;
      if (avgGrowth > 100) {
        this.reportBalanceIssue({
          type: 'difficulty',
          message: `적 HP 증가율이 너무 높습니다 (평균 ${avgGrowth.toFixed(1)}%)`,
          severity: 'high',
          recommendation: '스테이지별 적 HP 증가율을 50% 이하로 조정하는 것을 고려하세요.',
        });
      }
    }

    // 골드 경제 분석
    const goldStates = this.states.filter(s => s.gold > 0);
    if (goldStates.length > 0) {
      const finalGold = goldStates[goldStates.length - 1].gold;
      const finalStage = goldStates[goldStates.length - 1].stage;
      const goldPerStage = finalGold / Math.max(finalStage, 1);

      if (goldPerStage < 3) {
        this.reportBalanceIssue({
          type: 'economy',
          message: `스테이지당 골드 획득량이 낮습니다 (${goldPerStage.toFixed(1)}골드/스테이지)`,
          severity: 'medium',
          recommendation: '골드 보상을 증가시키거나 상점 아이템 가격을 조정하세요.',
        });
      }
    }
  }

  /**
   * 추천 사항 생성
   */
  private generateRecommendations(): string[] {
    const recommendations: string[] = [];

    if (this.bugs.length > 0) {
      recommendations.push(`${this.bugs.length}개의 버그가 발견되었습니다. 수정이 필요합니다.`);
    }

    if (this.balanceIssues.length > 0) {
      const highSeverity = this.balanceIssues.filter(i => i.severity === 'high').length;
      if (highSeverity > 0) {
        recommendations.push(`높은 심각도의 밸런싱 이슈 ${highSeverity}개가 발견되었습니다.`);
      }
    }

    const finalState = this.states[this.states.length - 1];
    if (finalState && finalState.health <= 0) {
      recommendations.push('게임 오버: 플레이어 생존 시간을 늘릴 방법을 고려하세요.');
    }

    if (finalState && finalState.gold < 10) {
      recommendations.push('골드가 부족합니다. 골드 획득량을 늘리거나 아이템 가격을 조정하세요.');
    }

    return recommendations;
  }

  /**
   * 리포트를 읽기 쉬운 형식으로 출력
   */
  static formatReport(report: GamePlayReport): string {
    let output = '\n';
    output += '═══════════════════════════════════════════════════════════\n';
    output += '🎮 게임 플레이 리포트\n';
    output += '═══════════════════════════════════════════════════════════\n';
    output += `게임 ID: ${report.gameId}\n`;
    output += `플레이 시간: ${(report.duration / 1000).toFixed(2)}초\n`;
    output += `최종 스테이지: ${report.finalStage}\n`;
    output += `최종 HP: ${report.finalHealth}/${report.states[0]?.maxHealth || 100}\n`;
    output += `최종 골드: ${report.finalGold}\n`;
    output += `최종 점수: ${report.finalScore}\n`;
    output += '\n';

    if (report.bugs.length > 0) {
      output += '🐛 발견된 버그:\n';
      report.bugs.forEach((bug, index) => {
        output += `  ${index + 1}. [${bug.type.toUpperCase()}] ${bug.message}\n`;
        if (bug.expected && bug.actual) {
          output += `     예상: ${bug.expected}\n`;
          output += `     실제: ${bug.actual}\n`;
        }
      });
      output += '\n';
    }

    if (report.balanceIssues.length > 0) {
      output += '⚖️ 밸런싱 이슈:\n';
      report.balanceIssues.forEach((issue, index) => {
        output += `  ${index + 1}. [${issue.severity.toUpperCase()}] ${issue.message}\n`;
        output += `     추천: ${issue.recommendation}\n`;
      });
      output += '\n';
    }

    if (report.recommendations.length > 0) {
      output += '💡 추천 사항:\n';
      report.recommendations.forEach((rec, index) => {
        output += `  ${index + 1}. ${rec}\n`;
      });
      output += '\n';
    }

    output += '═══════════════════════════════════════════════════════════\n';
    return output;
  }
}

