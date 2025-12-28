import express, { type Express } from 'express';
import { createServer, type Server } from 'http';
import { registerRoutes } from '../../server/routes';
import { InMemoryStorage } from '../../server/storage';
import type { GameSession } from '@shared/schema';

/**
 * 테스트용 서버 생성
 * 메모리 스토리지를 사용하여 안전하게 테스트
 */
export async function createTestServer(): Promise<Express> {
  // 테스트 환경에서는 항상 메모리 스토리지 사용
  if (!process.env.DATABASE_URL) {
    process.env.DATABASE_URL = ''; // 빈 문자열로 설정하여 InMemoryStorage 사용
  }

  const app = express();
  const httpServer = createServer(app);

  // JSON 파싱 미들웨어
  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // 라우트 등록
  await registerRoutes(httpServer, app);

  // 에러 핸들러는 registerRoutes에서 이미 등록됨

  return app;
}

/**
 * 테스트용 스토리지 (메모리)
 * 각 테스트마다 새로 생성하여 격리
 */
export class TestStorage extends InMemoryStorage {
  private snapshots: Map<string, GameSession> = new Map();

  /**
   * 현재 상태 스냅샷 저장
   */
  saveSnapshot(gameId: string): void {
    const session = this.sessions.get(gameId);
    if (session) {
      this.snapshots.set(gameId, JSON.parse(JSON.stringify(session)));
    }
  }

  /**
   * 스냅샷 복원
   */
  restoreSnapshot(gameId: string): boolean {
    const snapshot = this.snapshots.get(gameId);
    if (snapshot) {
      this.sessions.set(gameId, JSON.parse(JSON.stringify(snapshot)));
      return true;
    }
    return false;
  }

  /**
   * 모든 데이터 초기화
   */
  clear(): void {
    this.sessions.clear();
    this.snapshots.clear();
  }

  /**
   * 모든 게임 세션 조회 (디버깅용)
   */
  getAllSessions(): GameSession[] {
    return Array.from(this.sessions.values());
  }
}

