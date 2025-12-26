import { gameSessions, type GameSession, type InsertGameSession, type UpdateGameSession } from "@shared/schema";
import { db } from "./db";
import { eq } from "drizzle-orm";

export interface IStorage {
  createGameSession(session: InsertGameSession): Promise<GameSession>;
  getGameSession(id: string): Promise<GameSession | undefined>;
  updateGameSession(id: string, updates: UpdateGameSession): Promise<GameSession | undefined>;
  deleteGameSession(id: string): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async createGameSession(insertSession: InsertGameSession): Promise<GameSession> {
    const [session] = await db
      .insert(gameSessions)
      .values(insertSession)
      .returning();
    return session;
  }

  async getGameSession(id: string): Promise<GameSession | undefined> {
    const [session] = await db.select().from(gameSessions).where(eq(gameSessions.id, id));
    return session || undefined;
  }

  async updateGameSession(id: string, updates: UpdateGameSession): Promise<GameSession | undefined> {
    const [session] = await db
      .update(gameSessions)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(gameSessions.id, id))
      .returning();
    return session || undefined;
  }

  async deleteGameSession(id: string): Promise<void> {
    await db.delete(gameSessions).where(eq(gameSessions.id, id));
  }
}

export const storage = new DatabaseStorage();
