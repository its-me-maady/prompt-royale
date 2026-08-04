/**
 * agent-notes: { ctx: "P0 TDD red phase, Epic C Boss Raid Arena", deps: ["apps/web/src/engine/game-logic.ts"], state: "canonical", last: "tara@2026-08-04", key: ["owns game logic tests"] }
 */
import { describe, it, expect } from 'vitest';
import { calculateRoundResults, processRevive, GameState, PlayerVote } from '../../src/engine/game-logic';

describe('Game Engine: Boss Raid Arena', () => {
  const createBaseGameState = (): GameState => ({
    status: 'active',
    boss: {
      hp: 1000,
      maxHp: 1000
    },
    players: [
      { id: 'p1', hp: 100, status: 'alive' },
      { id: 'p2', hp: 100, status: 'alive' },
      { id: 'p3', hp: 100, status: 'alive' },
      { id: 'p4', hp: 100, status: 'alive' }
    ]
  });

  describe('calculateRoundResults', () => {
    it('handles 4/4 correct votes: Boss loses 100 HP, Players lose 0 HP', () => {
      const state = createBaseGameState();
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: true },
        { playerId: 'p2', isCorrect: true },
        { playerId: 'p3', isCorrect: true },
        { playerId: 'p4', isCorrect: true },
      ];

      const result = calculateRoundResults(state, votes);

      expect(result.boss.hp).toBe(900);
      result.players.forEach(p => {
        expect(p.hp).toBe(100);
        expect(p.status).toBe('alive');
      });
      expect(result.status).toBe('active');
    });

    it('handles 3/4 correct votes: Boss loses 60 HP, 1 wrong player loses 25 HP', () => {
      const state = createBaseGameState();
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: true },
        { playerId: 'p2', isCorrect: true },
        { playerId: 'p3', isCorrect: true },
        { playerId: 'p4', isCorrect: false },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.boss.hp).toBe(940);
      expect(result.players.find(p => p.id === 'p1')?.hp).toBe(100);
      expect(result.players.find(p => p.id === 'p4')?.hp).toBe(75);
    });

    it('handles 2/4 correct votes: Boss loses 25 HP, 2 wrong players lose 25 HP each', () => {
      const state = createBaseGameState();
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: true },
        { playerId: 'p2', isCorrect: true },
        { playerId: 'p3', isCorrect: false },
        { playerId: 'p4', isCorrect: false },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.boss.hp).toBe(975);
      expect(result.players.find(p => p.id === 'p1')?.hp).toBe(100);
      expect(result.players.find(p => p.id === 'p3')?.hp).toBe(75);
      expect(result.players.find(p => p.id === 'p4')?.hp).toBe(75);
    });

    it('handles 1/4 correct votes: Boss loses 10 HP, 3 wrong players lose 25 HP each', () => {
      const state = createBaseGameState();
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: true },
        { playerId: 'p2', isCorrect: false },
        { playerId: 'p3', isCorrect: false },
        { playerId: 'p4', isCorrect: false },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.boss.hp).toBe(990);
      expect(result.players.find(p => p.id === 'p1')?.hp).toBe(100);
      expect(result.players.find(p => p.id === 'p2')?.hp).toBe(75);
      expect(result.players.find(p => p.id === 'p3')?.hp).toBe(75);
      expect(result.players.find(p => p.id === 'p4')?.hp).toBe(75);
    });

    it('handles 0/4 correct votes: Boss loses 0 HP, all 4 players lose 30 HP', () => {
      const state = createBaseGameState();
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: false },
        { playerId: 'p2', isCorrect: false },
        { playerId: 'p3', isCorrect: false },
        { playerId: 'p4', isCorrect: false },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.boss.hp).toBe(1000);
      result.players.forEach(p => {
        expect(p.hp).toBe(70);
      });
    });

    it('knocks out a player when their HP reaches 0 (status becomes dead)', () => {
      const state = createBaseGameState();
      const p4Index = state.players.findIndex(p => p.id === 'p4');
      state.players[p4Index].hp = 25;
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: true },
        { playerId: 'p2', isCorrect: true },
        { playerId: 'p3', isCorrect: true },
        { playerId: 'p4', isCorrect: false },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.players.find(p => p.id === 'p4')?.hp).toBe(0);
      expect(result.players.find(p => p.id === 'p4')?.status).toBe('dead');
    });

    it('does not allow player HP to drop below 0', () => {
      const state = createBaseGameState();
      const p4Index = state.players.findIndex(p => p.id === 'p4');
      state.players[p4Index].hp = 10;
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: false },
        { playerId: 'p2', isCorrect: false },
        { playerId: 'p3', isCorrect: false },
        { playerId: 'p4', isCorrect: false },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.players.find(p => p.id === 'p4')?.hp).toBe(0);
      expect(result.players.find(p => p.id === 'p4')?.status).toBe('dead');
    });

    it('does not allow boss HP to drop below 0', () => {
      const state = createBaseGameState();
      state.boss.hp = 50;
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: true },
        { playerId: 'p2', isCorrect: true },
        { playerId: 'p3', isCorrect: true },
        { playerId: 'p4', isCorrect: true },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.boss.hp).toBe(0);
    });

    it('sets status to victory when boss HP reaches 0', () => {
      const state = createBaseGameState();
      state.boss.hp = 50;
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: true },
        { playerId: 'p2', isCorrect: true },
        { playerId: 'p3', isCorrect: true },
        { playerId: 'p4', isCorrect: true },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.status).toBe('victory');
    });

    it('sets status to revive when all players are dead', () => {
      const state = createBaseGameState();
      state.players.forEach(p => p.hp = 20); // Everyone dies next round
      const votes: PlayerVote[] = [
        { playerId: 'p1', isCorrect: false },
        { playerId: 'p2', isCorrect: false },
        { playerId: 'p3', isCorrect: false },
        { playerId: 'p4', isCorrect: false },
      ];
      const result = calculateRoundResults(state, votes);
      expect(result.players.every(p => p.status === 'dead')).toBe(true);
      expect(result.status).toBe('revive');
    });
  });

  describe('processRevive', () => {
    it('revives all players with 100 HP and sets status to active when revive is successful', () => {
      const state = createBaseGameState();
      state.status = 'revive';
      state.players.forEach(p => {
        p.hp = 0;
        p.status = 'dead';
      });
      const result = processRevive(state, true);
      expect(result.status).toBe('active');
      result.players.forEach(p => {
        expect(p.hp).toBe(100);
        expect(p.status).toBe('alive');
      });
    });

    it('sets status to defeat when revive fails', () => {
      const state = createBaseGameState();
      state.status = 'revive';
      state.players.forEach(p => {
        p.hp = 0;
        p.status = 'dead';
      });
      const result = processRevive(state, false);
      expect(result.status).toBe('defeat');
      result.players.forEach(p => {
        expect(p.hp).toBe(0);
        expect(p.status).toBe('dead');
      });
    });
  });
});
