import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertGameSessionSchema, updateGameSessionSchema, type Dice } from "@shared/schema";

const FIXED_SUITS = ['None', '♠', '♦', '♥', '♣'];

// 스테이지별 적 HP와 골드 보상 계산 (순차 진행 방식)
function getStageStats(stage: number) {
  const baseHp = 100;
  const baseReward = 3;
  const stageMultiplier = 1 + (stage - 1) * 0.5; // 스테이지마다 50% 증가
  
  return {
    enemyHp: Math.round(baseHp * stageMultiplier),
    goldReward: Math.round(baseReward * stageMultiplier),
    enemyDamage: Math.round(10 + (stage - 1) * 2), // 스테이지마다 데미지 증가
  };
}

function createInitialDices(): Dice[] {
  return Array.from({ length: 5 }, (_, i) => ({
    id: i,
    value: Math.floor(Math.random() * 6) + 1,
    suit: FIXED_SUITS[i] as Dice['suit'],
    locked: false,
  }));
}

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // 새 게임 시작
  app.post('/api/games/new', async (req, res) => {
    try {
      const initialDices = createInitialDices();
      const newSession = await storage.createGameSession({
        health: 100,
        maxHealth: 100,
        gold: 0,
        score: 0,
        currentStage: 1,
        currentRound: 1,
        gameState: 'stage_select',
        enemyHp: 100,
        maxEnemyHp: 100,
        enemyDamage: 10,
        pendingGoldReward: 0,
        rerollsLeft: 3,
        dices: initialDices as any,
        jokers: [],
        consumables: [],
        vouchers: [],
      });
      res.json(newSession);
    } catch (error) {
      console.error('Error creating new game:', error);
      res.status(500).json({ error: 'Failed to create new game' });
    }
  });

  // 게임 세션 불러오기
  app.get('/api/games/:id', async (req, res) => {
    try {
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Error fetching game session:', error);
      res.status(500).json({ error: 'Failed to fetch game session' });
    }
  });

  // 게임 상태 업데이트
  app.put('/api/games/:id', async (req, res) => {
    try {
      const updates = updateGameSessionSchema.parse(req.body);
      const session = await storage.updateGameSession(req.params.id, updates);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }
      res.json(session);
    } catch (error) {
      console.error('Error updating game session:', error);
      res.status(500).json({ error: 'Failed to update game session' });
    }
  });

  // 주사위 굴리기 (락된 주사위만 서버에 저장, 나머지는 물리 시뮬레이션)
  app.post('/api/games/:id/roll', async (req, res) => {
    try {
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      if (session.rerollsLeft <= 0) {
        return res.status(400).json({ error: 'No rerolls left' });
      }

      const { lockedDices } = req.body;
      const lockedMap: Record<number, { value: number }> = {};
      if (lockedDices && Array.isArray(lockedDices)) {
        lockedDices.forEach((d: { id: number; value: number }) => {
          lockedMap[d.id] = { value: d.value };
        });
      }
      
      const currentDices = session.dices as Dice[];
      
      // 주사위가 비어있으면 새로 생성
      let newDices: Dice[];
      if (currentDices.length === 0) {
        newDices = createInitialDices();
      } else {
        newDices = currentDices.map(d => {
          if (lockedMap[d.id] !== undefined) {
            return { ...d, value: lockedMap[d.id].value, locked: true };
          }
          return { ...d, locked: false };
        });
      }

      const updatedSession = await storage.updateGameSession(req.params.id, {
        dices: newDices as any,
        rerollsLeft: session.rerollsLeft - 1,
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Error rolling dices:', error);
      res.status(500).json({ error: 'Failed to roll dices' });
    }
  });

  // 핸드 제출 (데미지 계산)
  app.post('/api/games/:id/submit', async (req, res) => {
    try {
      const { damage } = req.body;
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      const newEnemyHp = Math.max(0, session.enemyHp - damage);
      const enemyDamage = session.enemyDamage || 10;
      const newPlayerHp = Math.max(0, session.health - enemyDamage);
      const newDices = createInitialDices();
      
      let newGameState = 'combat';
      let goldReward = 0;
      
      if (newPlayerHp === 0) {
        newGameState = 'game_over';
      } else if (newEnemyHp === 0) {
        newGameState = 'shop';
        goldReward = session.pendingGoldReward || 0;
      }

      const updatedSession = await storage.updateGameSession(req.params.id, {
        enemyHp: newEnemyHp,
        health: newPlayerHp,
        gold: session.gold + goldReward,
        score: session.score + damage,
        dices: newDices as any,
        rerollsLeft: 3,
        gameState: newGameState,
        pendingGoldReward: 0,
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Error submitting hand:', error);
      res.status(500).json({ error: 'Failed to submit hand' });
    }
  });

  // 다음 스테이지로 이동
  app.post('/api/games/:id/next-stage', async (req, res) => {
    try {
      const { stageChoice } = req.body; // 'easy', 'medium', 'hard', 'boss'
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      // 다음 스테이지 번호 계산 (현재 스테이지 + 1)
      const nextStage = session.currentStage + 1;
      const stageStats = getStageStats(nextStage);

      const updatedSession = await storage.updateGameSession(req.params.id, {
        gameState: 'combat',
        enemyHp: stageStats.enemyHp,
        maxEnemyHp: stageStats.enemyHp,
        enemyDamage: stageStats.enemyDamage,
        pendingGoldReward: stageStats.goldReward,
        currentStage: nextStage,
        rerollsLeft: 3,
        dices: [] as any,
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Error moving to next stage:', error);
      res.status(500).json({ error: 'Failed to move to next stage' });
    }
  });

  // 상점에서 아이템 구매
  app.post('/api/games/:id/shop/buy', async (req, res) => {
    try {
      const { itemType, item, cost } = req.body; // itemType: 'joker', 'consumable', 'voucher'
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      if (session.gold < cost) {
        return res.status(400).json({ error: 'Not enough gold' });
      }

      const updates: any = {
        gold: session.gold - cost,
      };

      if (itemType === 'joker') {
        updates.jokers = [...(session.jokers as any[]), item];
      } else if (itemType === 'consumable') {
        updates.consumables = [...(session.consumables as any[]), item];
      } else if (itemType === 'voucher') {
        updates.vouchers = [...(session.vouchers as any[]), item];
      }

      const updatedSession = await storage.updateGameSession(req.params.id, updates);
      res.json(updatedSession);
    } catch (error) {
      console.error('Error buying item:', error);
      res.status(500).json({ error: 'Failed to buy item' });
    }
  });

  // 상점 나가기
  app.post('/api/games/:id/shop/exit', async (req, res) => {
    try {
      const session = await storage.getGameSession(req.params.id);
      if (!session) {
        return res.status(404).json({ error: 'Game session not found' });
      }

      const updatedSession = await storage.updateGameSession(req.params.id, {
        gameState: 'stage_select',
      });

      res.json(updatedSession);
    } catch (error) {
      console.error('Error exiting shop:', error);
      res.status(500).json({ error: 'Failed to exit shop' });
    }
  });

  return httpServer;
}
