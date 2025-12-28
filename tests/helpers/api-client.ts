import type { Express } from 'express';
import request from 'supertest';
import type { GameSession, Dice } from '@shared/schema';

/**
 * 테스트용 API 클라이언트
 * 게임 API를 쉽게 호출할 수 있도록 래핑
 */
export class GameAPIClient {
  constructor(private app: Express) {}

  /**
   * 새 게임 생성
   */
  async createGame(): Promise<GameSession> {
    const response = await request(this.app)
      .post('/api/games/new')
      .expect(200);
    return response.body;
  }

  /**
   * 게임 세션 조회
   */
  async getGame(gameId: string): Promise<GameSession> {
    const response = await request(this.app)
      .get(`/api/games/${gameId}`)
      .expect(200);
    return response.body;
  }

  /**
   * 게임 상태 업데이트
   */
  async updateGame(gameId: string, updates: Partial<GameSession>): Promise<GameSession> {
    const response = await request(this.app)
      .put(`/api/games/${gameId}`)
      .send(updates)
      .expect(200);
    return response.body;
  }

  /**
   * 주사위 굴리기
   */
  async rollDice(gameId: string, lockedDices: Array<{ id: number; value: number }> = []): Promise<GameSession> {
    const response = await request(this.app)
      .post(`/api/games/${gameId}/roll`)
      .send({ lockedDices })
      .expect(200);
    return response.body;
  }

  /**
   * 핸드 제출 (데미지 계산)
   */
  async submitHand(gameId: string, damage: number): Promise<GameSession> {
    const response = await request(this.app)
      .post(`/api/games/${gameId}/submit`)
      .send({ damage })
      .expect(200);
    return response.body;
  }

  /**
   * 다음 스테이지로 이동
   */
  async nextStage(gameId: string, stageChoice: 'easy' | 'medium' | 'hard' | 'boss' = 'easy'): Promise<GameSession> {
    const response = await request(this.app)
      .post(`/api/games/${gameId}/next-stage`)
      .send({ stageChoice })
      .expect(200);
    return response.body;
  }

  /**
   * 상점에서 아이템 구매
   */
  async buyItem(
    gameId: string,
    itemType: 'joker' | 'consumable' | 'voucher',
    item: any,
    cost: number
  ): Promise<GameSession> {
    const response = await request(this.app)
      .post(`/api/games/${gameId}/shop/buy`)
      .send({ itemType, item, cost })
      .expect(200);
    return response.body;
  }

  /**
   * 상점 나가기
   */
  async exitShop(gameId: string): Promise<GameSession> {
    const response = await request(this.app)
      .post(`/api/games/${gameId}/shop/exit`)
      .expect(200);
    return response.body;
  }

  /**
   * 에러 케이스 테스트용: 존재하지 않는 게임 조회
   */
  async getGameExpect404(gameId: string): Promise<void> {
    await request(this.app)
      .get(`/api/games/${gameId}`)
      .expect(404);
  }

  /**
   * 에러 케이스 테스트용: 잘못된 입력으로 주사위 굴리기
   */
  async rollDiceExpect400(gameId: string, invalidData: any): Promise<any> {
    return request(this.app)
      .post(`/api/games/${gameId}/roll`)
      .send(invalidData);
  }

  /**
   * 에러 케이스 테스트용: 잘못된 데미지로 핸드 제출
   */
  async submitHandExpect400(gameId: string, damage: number): Promise<any> {
    return request(this.app)
      .post(`/api/games/${gameId}/submit`)
      .send({ damage });
  }

  /**
   * 에러 케이스 테스트용: 골드 부족으로 구매 시도
   */
  async buyItemExpect400(
    gameId: string,
    itemType: 'joker' | 'consumable' | 'voucher',
    item: any,
    cost: number
  ): Promise<any> {
    return request(this.app)
      .post(`/api/games/${gameId}/shop/buy`)
      .send({ itemType, item, cost });
  }
}

