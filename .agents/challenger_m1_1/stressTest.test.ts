import { describe, it, expect } from 'vitest';
import { resolveTurnScoring, isBossDefeated, isPartyWiped } from '../../../../teamwork_projects/prompt_royale/src/logic/gameEngine';
import { PlayerState, BossState } from '../../../../teamwork_projects/prompt_royale/src/types/game';

describe('Adversarial Stress Test Suite - gameEngine', () => {
  const createMockBoss = (hp = 1000): BossState => ({
    id: 'boss_1',
    name: 'Cyber Dragon',
    hp,
    maxHp: 1000,
  });

  const createMockPlayers = (): PlayerState[] => [
    { id: 1, name: 'Alice', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
    { id: 2, name: 'Bob', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
    { id: 3, name: 'Charlie', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
    { id: 4, name: 'Diana', hp: 100, maxHp: 100, isKnockedOut: false, selectedOption: null },
  ];

  it('1. Overkill damage to Boss clamps HP to 0', () => {
    const boss = createMockBoss(30);
    const players = createMockPlayers();
    const result = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A', 4: 'A' }, 'A');

    expect(result.updatedBossHp).toBe(0);
    expect(result.bossDamage).toBe(100);
    expect(isBossDefeated({ ...boss, hp: result.updatedBossHp })).toBe(true);
  });

  it('2. Overkill damage to Player clamps HP to 0 and sets isKnockedOut to true', () => {
    const boss = createMockBoss(1000);
    const players = createMockPlayers();
    players[0].hp = 10; // Alice has 10 HP left

    // 0/4 correct -> 30 recoil damage to all players
    const result = resolveTurnScoring(players, boss, { 1: 'B', 2: 'B', 3: 'B', 4: 'B' }, 'A');

    expect(result.updatedPlayers[0].hp).toBe(0);
    expect(result.updatedPlayers[0].isKnockedOut).toBe(true);
    expect(result.updatedPlayers[0].hp).not.toBeLessThan(0);
  });

  it('3. Negative initial Boss HP is handled gracefully and clamped to 0', () => {
    const boss = createMockBoss(-50);
    const players = createMockPlayers();
    const result = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A', 4: 'A' }, 'A');

    expect(result.updatedBossHp).toBe(0);
    expect(isBossDefeated({ ...boss, hp: result.updatedBossHp })).toBe(true);
  });

  it('4. Negative initial Player HP is handled gracefully and clamped to 0', () => {
    const boss = createMockBoss(1000);
    const players = createMockPlayers();
    players[1].hp = -20; // Bob starts with negative HP
    players[1].isKnockedOut = true;

    const result = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A' }, 'A');

    expect(result.updatedPlayers[1].hp).toBe(0);
    expect(result.updatedPlayers[1].isKnockedOut).toBe(true);
  });

  it('5. All 4 players knocked out handled without errors', () => {
    const boss = createMockBoss(1000);
    const players = createMockPlayers().map((p) => ({ ...p, hp: 0, isKnockedOut: true }));

    const result = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A', 4: 'A' }, 'A');

    expect(result.bossDamage).toBe(0);
    expect(result.playerRecoilDamage).toBe(30); // switch case default
    expect(result.incorrectPlayerIds).toEqual([]);
    expect(result.updatedBossHp).toBe(1000);
    result.updatedPlayers.forEach((p) => {
      expect(p.hp).toBe(0);
      expect(p.isKnockedOut).toBe(true);
    });
    expect(isPartyWiped(result.updatedPlayers)).toBe(true);
  });

  it('6. Empty votes object {} handled safely', () => {
    const boss = createMockBoss(1000);
    const players = createMockPlayers();

    const result = resolveTurnScoring(players, boss, {}, 'A');

    expect(result.bossDamage).toBe(0);
    expect(result.playerRecoilDamage).toBe(30);
    expect(result.incorrectPlayerIds).toEqual([1, 2, 3, 4]);
    result.updatedPlayers.forEach((p) => {
      expect(p.hp).toBe(70);
    });
  });

  it('7. Input objects immutability check', () => {
    const boss = createMockBoss(1000);
    const players = createMockPlayers();
    const bossHpBefore = boss.hp;
    const player1HpBefore = players[0].hp;

    resolveTurnScoring(players, boss, { 1: 'B', 2: 'B', 3: 'B', 4: 'B' }, 'A');

    expect(boss.hp).toBe(bossHpBefore);
    expect(players[0].hp).toBe(player1HpBefore);
  });

  it('8. Stress test: 10,000 randomized turn simulations', () => {
    let boss = createMockBoss(100000);
    let players = createMockPlayers();
    const options = ['A', 'B', 'C', 'D'];

    for (let turn = 0; turn < 10000; turn++) {
      const votes: Record<number, string> = {};
      players.forEach((p) => {
        if (!p.isKnockedOut) {
          votes[p.id] = options[Math.floor(Math.random() * options.length)];
        }
      });

      const correctAnswer = options[Math.floor(Math.random() * options.length)];
      const result = resolveTurnScoring(players, boss, votes, correctAnswer);

      boss = { ...boss, hp: result.updatedBossHp };
      players = result.updatedPlayers;

      // Invariants verification
      expect(boss.hp).toBeGreaterThanOrEqual(0);
      expect(Number.isNaN(boss.hp)).toBe(false);
      players.forEach((p) => {
        expect(p.hp).toBeGreaterThanOrEqual(0);
        expect(Number.isNaN(p.hp)).toBe(false);
        if (p.hp === 0) {
          expect(p.isKnockedOut).toBe(true);
        }
      });
    }
  });
});
