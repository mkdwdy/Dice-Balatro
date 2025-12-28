import { gameSessions, type GameSession, type InsertGameSession, type UpdateGameSession } from "@shared/schema";
import { eq } from "drizzle-orm";

export interface IStorage {
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  updateGameSession(id: string, updates: UpdateGameSession): Promise<GameSession | undefined>;
  deleteGameSession(id: string): Promise<void>;
}

// 데이터베이스 스토리지 (PostgreSQL 사용)
export class DatabaseStorage implements IStorage {
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const { db } = await import("./db");
    const [session] = await db
      .insert(gameSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const { db } = await import("./db");
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session || undefined;
  }

  async updateGameSession(id: string, updates: UpdateGameSession): Promise<GameSession | undefined> {
    const { db } = await import("./db");
    const [session] = await db
      .update(gameSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gameSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteGameSession(id: string): Promise<void> {
    const { db } = await import("./db");
    await db.delete(gameSessions).where(eq(gameSessions.id, id));
  }
}

// 메모리 스토리지 (개발/테스트용)
export class InMemoryStorage implements IStorage {
  private sessions: Map<string, GameSession> = new Map();

  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const id = crypto.randomUUID();
    const now = new Date();
    
    const session: GameSession = {
      id,
      ...insertSession,
      diceDeck: insertSession.diceDeck || [], // diceDeck이 없으면 빈 배열
      createdAt: now,
      updatedAt: now,
    } as GameSession;

    this.sessions.set(id, session);
    return session;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    return this.sessions.get(id);
  }

  async updateGameSession(id: string, updates: UpdateGameSession): Promise<GameSession | undefined> {
    const session = this.sessions.get(id);
    if (!session) {
      return undefined;
    }

    const updated: GameSession = {
      ...session,
      ...updates,
      // diceDeck이 업데이트되면 명시적으로 포함, 없으면 기존 값 유지
      diceDeck: updates.diceDeck !== undefined ? updates.diceDeck : (session.diceDeck || []),
      updatedAt: new Date(),
    } as GameSession;

    this.sessions.set(id, updated);
    return updated;
  }

  async deleteGameSession(id: string): Promise<void> {
    this.sessions.delete(id);
  }
}

// DATABASE_URL이 있으면 DatabaseStorage, 없으면 InMemoryStorage 사용
export const storage = process.env.DATABASE_URL
  ? new DatabaseStorage()
  : new InMemoryStorage();
