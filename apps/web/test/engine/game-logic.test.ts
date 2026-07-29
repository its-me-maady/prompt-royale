/**
 * agent-notes: { ctx: "P0 TDD red phase, Epic 2 Boss Raid Arena", deps: ["apps/web/src/engine/game-logic.ts"], state: "canonical", last: "tara@2026-07-29", key: ["owns game logic tests"] }
 */
import { describe, it, expect } from 'vitest';
import { calculateRoundResults, GameState, PlayerVote } from '../../src/engine/game-logic';

describe('Game Engine: Boss Raid Arena', () => {
  const createBaseGameState = (): GameState => ({
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
  });
});
