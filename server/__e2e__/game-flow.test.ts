import { describe, it, expect, beforeAll } from 'vitest';
import { createTestServer } from '../../tests/helpers/test-server';
import { GameAPIClient } from '../../tests/helpers/api-client';
import { captureGameState, formatGameState, compareGameStates } from '../../tests/helpers/game-state';
import type { Express } from 'express';

describe('전체 게임 플레이 흐름', () => {
  let app: Express;
  let api: GameAPIClient;

  beforeAll(async () => {
    app = await createTestServer();
    api = new GameAPIClient(app);
  });

  it('게임 시작부터 상점까지의 전체 흐름', async () => {
    console.log('\n🎮 게임 플레이 시작...\n');

    // 1. 게임 생성
    console.log('1️⃣ 게임 생성 중...');
    const game = await api.createGame();
    expect(game.id).toBeDefined();
    expect(game.gameState).toBe('stage_select');
    expect(game.health).toBe(100);
    expect(game.gold).toBe(0);
    console.log(formatGameState(game));

    // 2. 스테이지 선택 및 시작
    console.log('\n2️⃣ 스테이지 1 시작...');
    const stage1 = await api.nextStage(game.id, 'easy');
    expect(stage1.gameState).toBe('combat');
    expect(stage1.currentStage).toBe(1);
    expect(stage1.enemyHp).toBeGreaterThan(0);
    console.log(formatGameState(stage1));

    // 3. 주사위 굴리기
    console.log('\n3️⃣ 주사위 굴리기...');
    const beforeRoll = await api.getGame(game.id);
    const afterRoll = await api.rollDice(game.id, []);
    expect(afterRoll.rerollsLeft).toBe(beforeRoll.rerollsLeft - 1);
    expect(afterRoll.dices).toBeDefined();
    console.log(`리롤 남은 횟수: ${afterRoll.rerollsLeft}`);
    console.log(`주사위 개수: ${Array.isArray(afterRoll.dices) ? afterRoll.dices.length : 0}개`);

    // 4. 핸드 제출 (적 처치)
    console.log('\n4️⃣ 핸드 제출 (적 처치)...');
    const beforeSubmit = await api.getGame(game.id);
    const damage = 1000; // 큰 데미지로 적 처치
    const afterSubmit = await api.submitHand(game.id, damage);
    
    const comparison = compareGameStates(beforeSubmit, afterSubmit);
    console.log('변경 사항:');
    comparison.changes.forEach(change => console.log(`  - ${change}`));
    if (comparison.warnings.length > 0) {
      console.log('경고:');
      comparison.warnings.forEach(warning => console.log(`  ${warning}`));
    }

    // 5. 상점 확인
    expect(afterSubmit.gameState).toBe('shop');
    expect(afterSubmit.gold).toBeGreaterThan(0);
    console.log('\n5️⃣ 상점 도착!');
    console.log(formatGameState(afterSubmit));

    // 6. 상점에서 아이템 구매
    console.log('\n6️⃣ 상점에서 조커 구매...');
    const beforeShop = await api.getGame(game.id);
    const joker = {
      id: 'joker_1',
      name: 'Lucky Joker',
      description: '+10% damage on all hands',
      effect: 'damage_boost',
    };
    const afterShop = await api.buyItem(game.id, 'joker', joker, 5);
    expect(afterShop.gold).toBe(beforeShop.gold - 5);
    expect(Array.isArray(afterShop.jokers) && afterShop.jokers.length).toBeGreaterThan(0);
    console.log(`골드: ${beforeShop.gold} → ${afterShop.gold}`);
    console.log(`조커 개수: ${Array.isArray(afterShop.jokers) ? afterShop.jokers.length : 0}개`);

    // 7. 상점 나가기
    console.log('\n7️⃣ 상점 나가기...');
    const finalState = await api.exitShop(game.id);
    expect(finalState.gameState).toBe('stage_select');
    console.log(formatGameState(finalState));

    console.log('\n✅ 게임 플레이 완료!\n');
  });

  it('여러 스테이지를 진행하며 게임 상태 추적', async () => {
    console.log('\n🎮 멀티 스테이지 게임 플레이...\n');

    const game = await api.createGame();
    const states: ReturnType<typeof captureGameState>[] = [];

    // 스테이지 1
    console.log('스테이지 1 진행...');
    let currentGame = await api.nextStage(game.id);
    states.push(captureGameState(currentGame));
    await api.rollDice(game.id);
    currentGame = await api.submitHand(game.id, 1000);
    states.push(captureGameState(currentGame));

    // 스테이지 2
    console.log('스테이지 2 진행...');
    currentGame = await api.exitShop(game.id);
    currentGame = await api.nextStage(game.id);
    states.push(captureGameState(currentGame));
    await api.rollDice(game.id);
    currentGame = await api.submitHand(game.id, 1000);
    states.push(captureGameState(currentGame));

    // 상태 분석
    console.log('\n📊 게임 진행 분석:');
    states.forEach((state, index) => {
      console.log(`\n상태 ${index + 1}:`);
      console.log(`  스테이지: ${state.stage}`);
      console.log(`  HP: ${state.health}/${state.maxHealth}`);
      console.log(`  골드: ${state.gold}`);
      console.log(`  게임 상태: ${state.gameState}`);
    });

    // 밸런싱 검증
    expect(states[1].gold).toBeGreaterThan(states[0].gold); // 스테이지 1 완료 후 골드 획득
    expect(states[3].gold).toBeGreaterThan(states[1].gold); // 스테이지 2 완료 후 골드 증가
    expect(states[2].enemyHp).toBeGreaterThan(states[0].enemyHp); // 스테이지가 올라갈수록 적이 강해짐
  });

  it('게임 오버 시나리오', async () => {
    console.log('\n💀 게임 오버 시나리오 테스트...\n');

    const game = await api.createGame();
    await api.nextStage(game.id);

    // 플레이어 HP를 0으로 만들기 위해 적의 공격력만큼 여러 번 공격받기
    let currentGame = await api.getGame(game.id);
    const enemyDamage = currentGame.enemyDamage;

    // HP를 낮추기 위해 게임 상태를 직접 수정 (테스트용)
    currentGame = await api.updateGame(game.id, {
      health: enemyDamage, // 적의 공격력만큼만 남김
    });

    // 핸드 제출 (적이 공격)
    currentGame = await api.submitHand(game.id, 0); // 데미지를 주지 않음

    // 게임 오버 확인
    expect(currentGame.gameState).toBe('game_over');
    expect(currentGame.health).toBe(0);
    console.log('✅ 게임 오버 상태 확인됨');
    console.log(formatGameState(currentGame));
  });
});

