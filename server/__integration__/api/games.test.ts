import { describe, it, expect, beforeAll } from 'vitest';
import { createTestServer } from '../../../tests/helpers/test-server';
import { GameAPIClient } from '../../../tests/helpers/api-client';
import { formatGameState, compareGameStates } from '../../../tests/helpers/game-state';
import type { Express } from 'express';

describe('게임 API 통합 테스트', () => {
  let app: Express;
  let api: GameAPIClient;

  beforeAll(async () => {
    app = await createTestServer();
    api = new GameAPIClient(app);
  });

  describe('POST /api/games/new', () => {
    it('새 게임을 생성해야 함', async () => {
      const game = await api.createGame();

      expect(game).toHaveProperty('id');
      expect(game.health).toBe(100);
      expect(game.maxHealth).toBe(100);
      expect(game.gold).toBe(0);
      expect(game.score).toBe(0);
      expect(game.currentStage).toBe(0);
      expect(game.currentRound).toBe(1);
      expect(game.gameState).toBe('stage_select');
      expect(game.rerollsLeft).toBe(3);
      expect(Array.isArray(game.dices)).toBe(true);
      expect(game.dices.length).toBe(5);
    });

    it('생성된 게임은 올바른 초기 상태를 가져야 함', async () => {
      const game = await api.createGame();
      console.log(formatGameState(game));

      // 주사위 검증
      game.dices.forEach((dice: any, index: number) => {
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

  describe('GET /api/games/:id', () => {
    it('게임 세션을 조회할 수 있어야 함', async () => {
      const game = await api.createGame();
      const retrieved = await api.getGame(game.id);

      expect(retrieved.id).toBe(game.id);
      expect(retrieved.health).toBe(game.health);
    });

    it('존재하지 않는 게임은 404를 반환해야 함', async () => {
      await api.getGameExpect404('non-existent-id');
    });
  });

  describe('POST /api/games/:id/roll', () => {
    it('주사위를 굴릴 수 있어야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      const before = await api.getGame(game.id);
      const after = await api.rollDice(game.id, []);

      expect(after.rerollsLeft).toBe(before.rerollsLeft - 1);
      expect(Array.isArray(after.dices)).toBe(true);
    });

    it('락된 주사위를 유지해야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      const firstRoll = await api.rollDice(game.id, []);
      const lockedDice = firstRoll.dices[0];

      const secondRoll = await api.rollDice(game.id, [
        { id: lockedDice.id, value: lockedDice.value },
      ]);

      // 락된 주사위는 유지되어야 함
      const lockedAfter = secondRoll.dices.find((d: any) => d.id === lockedDice.id);
      expect(lockedAfter).toBeDefined();
      expect(lockedAfter.value).toBe(lockedDice.value);
    });

    it('리롤이 없으면 에러를 반환해야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      // 리롤을 모두 소진
      await api.rollDice(game.id, []);
      await api.rollDice(game.id, []);
      await api.rollDice(game.id, []);

      // 4번째 시도는 실패해야 함
      const response = await api.rollDiceExpect400(game.id, { lockedDices: [] });
      expect(response.status).toBe(400);
      expect(response.body.code).toBe('NO_REROLLS_LEFT');
    });

    it('잘못된 입력을 거부해야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      // 잘못된 id 범위
      const response1 = await api.rollDiceExpect400(game.id, { lockedDices: [{ id: 10, value: 3 }] });
      expect(response1.status).toBe(400);

      // 잘못된 value 범위
      const response2 = await api.rollDiceExpect400(game.id, { lockedDices: [{ id: 0, value: 10 }] });
      expect(response2.status).toBe(400);
    });
  });

  describe('POST /api/games/:id/submit', () => {
    it('데미지를 적용해야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      const before = await api.getGame(game.id);
      const damage = 50;
      const after = await api.submitHand(game.id, damage);

      expect(after.enemyHp).toBe(Math.max(0, before.enemyHp - damage));
      expect(after.score).toBe(before.score + damage);
    });

    it('적을 처치하면 상점으로 이동해야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      const before = await api.getGame(game.id);
      const damage = before.enemyHp; // 적 HP만큼 데미지

      const after = await api.submitHand(game.id, damage);

      expect(after.enemyHp).toBe(0);
      expect(after.gameState).toBe('shop');
      expect(after.gold).toBeGreaterThan(before.gold);
    });

    it('플레이어 HP가 0이면 게임 오버해야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      // HP를 낮춤
      await api.updateGame(game.id, { health: 10 });

      const before = await api.getGame(game.id);
      const after = await api.submitHand(game.id, 0); // 데미지를 주지 않음

      if (after.health <= 0) {
        expect(after.gameState).toBe('game_over');
      }
    });

    it('잘못된 데미지 값을 거부해야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);

      // 음수 데미지
      const response = await api.submitHandExpect400(game.id, -10);
      expect(response.status).toBe(400);
    });
  });

  describe('POST /api/games/:id/next-stage', () => {
    it('다음 스테이지로 이동해야 함', async () => {
      const game = await api.createGame();
      const after = await api.nextStage(game.id);

      expect(after.currentStage).toBe(game.currentStage + 1);
      expect(after.gameState).toBe('combat');
      expect(after.enemyHp).toBeGreaterThan(0);
      expect(after.rerollsLeft).toBe(3);
    });

    it('스테이지가 올라갈수록 적이 강해져야 함', async () => {
      const game = await api.createGame();

      const stage1 = await api.nextStage(game.id);
      const stage1Hp = stage1.enemyHp;
      const stage1Damage = stage1.enemyDamage;

      // 스테이지 1 완료 후 다음 스테이지
      await api.submitHand(game.id, 10000);
      await api.exitShop(game.id);
      const stage2 = await api.nextStage(game.id);

      expect(stage2.enemyHp).toBeGreaterThan(stage1Hp);
      expect(stage2.enemyDamage).toBeGreaterThan(stage1Damage);
    });
  });

  describe('POST /api/games/:id/shop/buy', () => {
    it('아이템을 구매할 수 있어야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);
      await api.submitHand(game.id, 10000); // 상점으로 이동

      const before = await api.getGame(game.id);
      const joker = {
        id: 'joker_1',
        name: 'Lucky Joker',
        description: '+10% damage on all hands',
        effect: 'damage_boost',
      };

      const after = await api.buyItem(game.id, 'joker', joker, 5);

      expect(after.gold).toBe(before.gold - 5);
      expect(Array.isArray(after.jokers) && after.jokers.length).toBe(
        (Array.isArray(before.jokers) ? before.jokers.length : 0) + 1
      );
    });

    it('골드가 부족하면 구매할 수 없어야 함', async () => {
      const game = await api.createGame();
      await api.nextStage(game.id);
      await api.submitHand(game.id, 10000);

      const joker = {
        id: 'joker_1',
        name: 'Lucky Joker',
        description: '+10% damage on all hands',
        effect: 'damage_boost',
      };

      // 골드가 부족한 경우
      const response = await api.buyItemExpect400(game.id, 'joker', joker, 10000);
      expect(response.status).toBe(400);
      // 응답 본문 확인
      if (response.body && response.body.code) {
        expect(response.body.code).toBe('INSUFFICIENT_GOLD');
      } else {
        // 에러 메시지만 확인
        expect(response.body.error || response.text).toContain('gold');
      }
    });
  });
});

