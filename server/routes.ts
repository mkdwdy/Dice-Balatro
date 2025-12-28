import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertGameSessionSchema, 
  updateGameSessionSchema, 
  type Dice,
  type DeckDice,
  type DiceFace,
  isDiceArray,
  isDeckDiceArray,
} from "@shared/schema";
import { AppError } from "./middleware/errorHandler";
import { asyncHandler } from "./middleware/asyncHandler";
import {
  rollDiceSchema,
} from "./validators/gameValidators";

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

// 초기 주사위 덱 생성 (각 주사위는 6면체)
// currentTopFace는 클라이언트에서 실제 주사위 값이 결정된 후 동기화로 설정됨
function createInitialDiceDeck(): DeckDice[] {
  return Array.from({ length: 5 }, (_, i) => {
    // 각 주사위의 6개 면 생성
    const faces: DiceFace[] = Array.from({ length: 6 }, (_, faceIndex) => {
      // 기본적으로 각 면은 1-6 값과 슈트
      const value = faceIndex + 1; // 1, 2, 3, 4, 5, 6
      const suit = FIXED_SUITS[i] as DiceFace['suit']; // 각 주사위는 기본 슈트를 가짐
      return { value, suit };
    });
    
    return {
      id: i,
      faces,
      currentTopFace: 0, // 초기값은 0 (클라이언트에서 실제 값 결정 후 동기화로 업데이트됨)
    };
  });
}

// 주사위 값은 클라이언트에서 물리 시뮬레이션으로 결정되므로
// 서버에서는 빈 배열로 시작 (클라이언트에서 첫 번째 굴리기 후 값이 설정됨)

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // 새 게임 시작
  app.post('/api/games/new', asyncHandler(async (req, res) => {
    const initialDiceDeck = createInitialDiceDeck();
    // 주사위 값은 클라이언트에서 물리 시뮬레이션으로 결정되므로 빈 배열로 시작
    const initialDices: Dice[] = [];
    // 첫 스테이지(스테이지 1)의 골드 보상 설정
    const firstStageStats = getStageStats(1);
    const newSession = await storage.createGameSession({
      health: 100,
      maxHealth: 100,
      gold: 0,
      score: 0,
      currentStage: 0,
      currentRound: 1,
      gameState: 'stage_select',
      enemyHp: 100,
      maxEnemyHp: 100,
      enemyDamage: 10,
      pendingGoldReward: firstStageStats.goldReward, // 첫 스테이지 골드 보상 설정
      rerollsLeft: 3,
      dices: initialDices,
      diceDeck: initialDiceDeck,
      jokers: [],
      consumables: [],
      vouchers: [],
      handUpgrades: {},
    });
    res.json(newSession);
  }));

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
  app.post('/api/games/:id/roll', asyncHandler(async (req, res) => {
    const validatedBody = rollDiceSchema.parse(req.body);
    const session = await storage.getGameSession(req.params.id);
    
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
    }

    if (session.rerollsLeft <= 0) {
      throw new AppError(400, 'No rerolls left', 'NO_REROLLS_LEFT');
    }

    const lockedMap: Record<number, { value: number }> = {};
    if (validatedBody.lockedDices && validatedBody.lockedDices.length > 0) {
      validatedBody.lockedDices.forEach((d) => {
        lockedMap[d.id] = { value: d.value };
      });
    }
    
    // 타입 가드를 사용하여 안전하게 주사위 배열 처리
    const currentDices = isDiceArray(session.dices) ? session.dices : [];
    const currentDeck = isDeckDiceArray(session.diceDeck) ? session.diceDeck : [];
    
    // 덱은 절대 변경하지 않음 (클라이언트에서 실제 값이 결정된 후 동기화로만 업데이트됨)
    // 주사위가 비어있으면 덱만 생성 (dices는 클라이언트에서 설정됨)
    let newDices: Dice[];
    let newDeck: DeckDice[];
    
    if (currentDices.length === 0 || currentDeck.length === 0) {
      // 덱만 생성 (currentTopFace는 0으로 시작, 클라이언트에서 동기화로 업데이트됨)
      newDeck = createInitialDiceDeck();
      // 주사위 값은 클라이언트에서 물리 시뮬레이션으로 결정되므로 빈 배열로 시작
      newDices = [];
    } else {
      // 덱은 그대로 유지 (절대 변경하지 않음)
      newDeck = currentDeck;
      
      // 현재 손에 있는 주사위 업데이트 (잠긴 주사위만 locked 상태 변경)
      // 잠기지 않은 주사위는 클라이언트에서 물리 시뮬레이션으로 값이 결정됨
      newDices = currentDices.map(d => {
        if (lockedMap[d.id] !== undefined) {
          // 잠긴 주사위는 값과 locked 상태 유지
          return { ...d, locked: true };
        }
        // 잠기지 않은 주사위는 클라이언트에서 값이 결정되므로 기존 값 유지
        // (클라이언트에서 물리 시뮬레이션 후 동기화로 업데이트됨)
        return { ...d, locked: false };
      });
    }

    const updatedSession = await storage.updateGameSession(req.params.id, {
      dices: newDices,
      diceDeck: newDeck,
      rerollsLeft: session.rerollsLeft - 1,
    });

    if (!updatedSession) {
      throw new AppError(500, 'Failed to update game session', 'UPDATE_FAILED');
    }

    res.json(updatedSession);
  }));

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
      
      // 새로운 라운드 시작: 덱은 유지하고 currentTopFace만 초기화 (클라이언트에서 동기화로 업데이트됨)
      const currentDeck = isDeckDiceArray(session.diceDeck) ? session.diceDeck : [];
      const newDeck = currentDeck.length > 0 
        ? currentDeck.map(d => ({ ...d, currentTopFace: 0 })) // 초기화만 (클라이언트에서 동기화로 업데이트됨)
        : createInitialDiceDeck();
      // 주사위 값은 클라이언트에서 물리 시뮬레이션으로 결정되므로 빈 배열로 시작
      const newDices: Dice[] = [];
      
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
        dices: newDices,
        diceDeck: newDeck,
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

      // 새로운 스테이지 시작: 덱은 유지하고 currentTopFace만 초기화
      const currentDeck = isDeckDiceArray(session.diceDeck) ? session.diceDeck : [];
      const newDeck = currentDeck.length > 0
        ? currentDeck.map(d => ({ ...d, currentTopFace: 0 })) // 초기화만 (클라이언트에서 동기화로 업데이트됨)
        : createInitialDiceDeck();
      // 주사위 값은 클라이언트에서 물리 시뮬레이션으로 결정되므로 빈 배열로 시작
      const newDices: Dice[] = [];

      const updatedSession = await storage.updateGameSession(req.params.id, {
        gameState: 'combat',
        enemyHp: stageStats.enemyHp,
        maxEnemyHp: stageStats.enemyHp,
        enemyDamage: stageStats.enemyDamage,
        pendingGoldReward: stageStats.goldReward,
        currentStage: nextStage,
        rerollsLeft: 3,
        dices: newDices,
        diceDeck: newDeck,
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

  // 주사위 덱의 currentTopFace를 실제 값에 맞춰 업데이트
  app.post('/api/games/:id/sync-dice-deck', asyncHandler(async (req, res) => {
    const { dices } = req.body; // { id: number, value: number, suit: string }[]
    const session = await storage.getGameSession(req.params.id);
    
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
    }

    const currentDeck = isDeckDiceArray(session.diceDeck) ? session.diceDeck : [];
    
    if (currentDeck.length === 0) {
      throw new AppError(400, 'Dice deck not found', 'DICE_DECK_NOT_FOUND');
    }

    // 각 주사위의 실제 값과 슈트에 맞는 면을 찾아서 currentTopFace 업데이트
    const updatedDeck = currentDeck.map(deckDice => {
      const clientDice = dices.find((d: any) => d.id === deckDice.id);
      
      if (!clientDice) {
        return deckDice; // 클라이언트에서 값이 없으면 그대로 유지
      }

      // 값과 슈트가 일치하는 면 찾기
      const matchingFaceIndex = deckDice.faces.findIndex(
        face => face.value === clientDice.value && face.suit === clientDice.suit
      );

      if (matchingFaceIndex !== -1) {
        return {
          ...deckDice,
          currentTopFace: matchingFaceIndex,
        };
      }

      // 정확히 일치하는 면이 없으면 값만 일치하는 면 찾기
      const valueMatchingFaceIndex = deckDice.faces.findIndex(
        face => face.value === clientDice.value
      );

      if (valueMatchingFaceIndex !== -1) {
        return {
          ...deckDice,
          currentTopFace: valueMatchingFaceIndex,
        };
      }

      // 값도 일치하지 않으면 그대로 유지
      return deckDice;
    });

    const updatedSession = await storage.updateGameSession(req.params.id, {
      diceDeck: updatedDeck,
    });

    if (!updatedSession) {
      throw new AppError(500, 'Failed to update game session', 'UPDATE_FAILED');
    }

    res.json(updatedSession);
  }));

  return httpServer;
}
