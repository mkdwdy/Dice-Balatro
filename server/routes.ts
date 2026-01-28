import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  updateGameSessionSchema, 
  type Dice,
  type DeckDice,
  isDiceArray,
  isDeckDiceArray,
  isJokerArray,
  isConsumableArray,
  isVoucherArray,
} from "@shared/schema";
import { getStageStats, createInitialDiceDeck } from "@shared/gameLogic";
import { AppError } from "./middleware/errorHandler";
import { asyncHandler } from "./middleware/asyncHandler";
import {
  rollDiceSchema,
  submitHandSchema,
  nextStageSchema,
  shopBuySchema,
  syncDiceDeckSchema,
} from "./validators/gameValidators";

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
  app.get('/api/games/:id', asyncHandler(async (req, res) => {
    const session = await storage.getGameSession(req.params.id);
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
    }
    res.json(session);
  }));

  // 게임 상태 업데이트
  app.put('/api/games/:id', asyncHandler(async (req, res) => {
    const updates = updateGameSessionSchema.parse(req.body);
    const session = await storage.updateGameSession(req.params.id, updates);
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
    }
    res.json(session);
  }));

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

  // 핸드 제출 (데미지 계산) - 순차 발동 시스템 적용
  app.post('/api/games/:id/submit', asyncHandler(async (req, res) => {
    const validatedBody = submitHandSchema.parse(req.body);
    // 항상 최신 세션을 가져옴 (여러 번 공격 시 중요)
    const session = await storage.getGameSession(req.params.id);
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
    }
    
    // 디버깅: 세션 상태 확인
    console.log(`[SERVER DEBUG] Submit - Current gold: ${session.gold}, Pending reward: ${session.pendingGoldReward}, Enemy HP: ${session.enemyHp}`);

    // 순차 발동 시스템으로 데미지 계산
    const { activateDicesSequentially } = await import('@shared/diceActivation');
    const { getActiveDicesForHand } = await import('@shared/gameLogic');
    const { isJokerArray } = await import('@shared/schema');
    
    const jokers = isJokerArray(session.jokers) ? session.jokers : [];
    const handUpgrades = (session.handUpgrades as Record<string, number>) || {};
    
    // 족보 Multiplier 찾기
    const HAND_TYPES = [
      { name: 'Yahtzee', multiplier: 30 },
      { name: 'Straight Flush', multiplier: 50 },
      { name: 'Four of a Kind', multiplier: 5 },
      { name: 'Full House', multiplier: 4 },
      { name: 'Flush', multiplier: 10 },
      { name: 'Straight 5', multiplier: 4 },
      { name: 'Triple', multiplier: 3 },
      { name: 'Two Pair', multiplier: 2 },
      { name: 'Straight 4', multiplier: 2 },
      { name: 'Pair', multiplier: 1 },
      { name: 'Straight 3', multiplier: 1 },
      { name: 'High Dice', multiplier: 0 },
    ];
    
    const handType = HAND_TYPES.find(h => h.name === validatedBody.handName);
    const handMultiplier = handType?.multiplier || 0;
    const upgradeBonus = handUpgrades[validatedBody.handName] || 0;
    const totalHandMultiplier = handMultiplier + upgradeBonus;
    
    // 발라트로 방식: 족보에 사용된 주사위만 발동
    const activeDices = getActiveDicesForHand(validatedBody.handName, validatedBody.lockedDices);
    
    // 디버깅: 필터링 결과 확인
    console.log(`[SERVER DEBUG] Hand: ${validatedBody.handName}`);
    console.log(`[SERVER DEBUG] Total locked dice: ${validatedBody.lockedDices.length}`);
    console.log(`[SERVER DEBUG] Locked dice values: ${validatedBody.lockedDices.map(d => `${d.id}:${d.value}`).join(', ')}`);
    console.log(`[SERVER DEBUG] Active dice (after filtering): ${activeDices.length}`);
    console.log(`[SERVER DEBUG] Active dice IDs: ${activeDices.map(d => d.id).join(', ')}`);
    console.log(`[SERVER DEBUG] Active dice values: ${activeDices.map(d => `${d.id}:${d.value}`).join(', ')}`);
    
    if (activeDices.length === 0) {
      console.error(`[SERVER ERROR] No active dice found for hand: ${validatedBody.handName}`);
    }
    
    // 순차 발동 실행 (족보에 사용된 주사위만)
    const activationResult = activateDicesSequentially(
      activeDices,
      jokers,
      totalHandMultiplier,
      handUpgrades,
      validatedBody.handName // 족보 이름 전달
    );
    
    // 디버깅: 발동 결과 확인
    console.log(`[SERVER DEBUG] Activation result count: ${activationResult.activations.length}`);
    console.log(`[SERVER DEBUG] Activation result dice IDs: ${activationResult.activations.map(a => a.dice.id).join(', ')}`);
    
    const damage = Math.round(activationResult.finalDamage);

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
      console.log(`[SERVER DEBUG] Enemy defeated!`);
      console.log(`[SERVER DEBUG] Pending gold reward: ${session.pendingGoldReward}`);
      console.log(`[SERVER DEBUG] Current gold: ${session.gold}`);
      console.log(`[SERVER DEBUG] Gold reward to add: ${goldReward}`);
      console.log(`[SERVER DEBUG] New gold will be: ${session.gold + goldReward}`);
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
      // 적이 처치되었을 때만 pendingGoldReward를 0으로 초기화
      // 적이 처치되지 않았으면 기존 값을 유지
      pendingGoldReward: newEnemyHp === 0 ? 0 : session.pendingGoldReward,
    });
    
    // 골드 업데이트 확인
    if (newEnemyHp === 0) {
      console.log(`[SERVER DEBUG] Updated session gold: ${updatedSession?.gold}, Expected: ${session.gold + goldReward}`);
    }

    if (!updatedSession) {
      throw new AppError(500, 'Failed to update game session', 'UPDATE_FAILED');
    }

    // 순차 발동 결과를 응답에 포함
    res.json({
      ...updatedSession,
      activationResult: {
        activations: activationResult.activations,
        totalChips: activationResult.totalChips,
        totalMultiplier: activationResult.totalMultiplier,
        finalDamage: activationResult.finalDamage,
      },
    });
  }));

  // 다음 스테이지로 이동
  app.post('/api/games/:id/next-stage', asyncHandler(async (req, res) => {
    const validatedBody = nextStageSchema.parse(req.body);
    const session = await storage.getGameSession(req.params.id);
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
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

    if (!updatedSession) {
      throw new AppError(500, 'Failed to update game session', 'UPDATE_FAILED');
    }

    res.json(updatedSession);
  }));

  // 상점에서 아이템 구매
  app.post('/api/games/:id/shop/buy', asyncHandler(async (req, res) => {
    const validatedBody = shopBuySchema.parse(req.body);
    const session = await storage.getGameSession(req.params.id);
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
    }

    if (session.gold < validatedBody.cost) {
      throw new AppError(400, 'Not enough gold', 'INSUFFICIENT_GOLD');
    }

    const currentJokers = isJokerArray(session.jokers) ? session.jokers : [];
    const currentConsumables = isConsumableArray(session.consumables) ? session.consumables : [];
    const currentVouchers = isVoucherArray(session.vouchers) ? session.vouchers : [];

    let goldChange = -validatedBody.cost;
    
    // 골드 코인 구매 시 골드 증가
    if (validatedBody.itemType === 'consumable' && validatedBody.item.effect === 'gold') {
      // 골드 코인: $2 구매 시 $5 획득 (순수익 +$3)
      // 하지만 실제로는 $5를 획득하므로, cost를 차감한 후 $5를 추가
      goldChange = -validatedBody.cost + 5;
    }

    const updates: {
      gold: number;
      jokers?: typeof currentJokers;
      consumables?: typeof currentConsumables;
      vouchers?: typeof currentVouchers;
    } = {
      gold: session.gold + goldChange,
    };

    if (validatedBody.itemType === 'joker') {
      updates.jokers = [...currentJokers, validatedBody.item];
    } else if (validatedBody.itemType === 'consumable') {
      updates.consumables = [...currentConsumables, validatedBody.item];
    } else if (validatedBody.itemType === 'voucher') {
      updates.vouchers = [...currentVouchers, validatedBody.item];
    }

    const updatedSession = await storage.updateGameSession(req.params.id, updates);
    if (!updatedSession) {
      throw new AppError(500, 'Failed to update game session', 'UPDATE_FAILED');
    }

    res.json(updatedSession);
  }));

  // 상점 나가기
  app.post('/api/games/:id/shop/exit', asyncHandler(async (req, res) => {
    const session = await storage.getGameSession(req.params.id);
    if (!session) {
      throw new AppError(404, 'Game session not found', 'SESSION_NOT_FOUND');
    }

    const updatedSession = await storage.updateGameSession(req.params.id, {
      gameState: 'stage_select',
    });

    if (!updatedSession) {
      throw new AppError(500, 'Failed to update game session', 'UPDATE_FAILED');
    }

    res.json(updatedSession);
  }));

  // 주사위 덱의 currentTopFace를 실제 값에 맞춰 업데이트
  app.post('/api/games/:id/sync-dice-deck', asyncHandler(async (req, res) => {
    const validatedBody = syncDiceDeckSchema.parse(req.body);
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
      const clientDice = validatedBody.dices.find((d) => d.id === deckDice.id);
      
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
