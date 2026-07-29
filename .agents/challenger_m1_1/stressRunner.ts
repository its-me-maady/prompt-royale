import { resolveTurnScoring, isBossDefeated, isPartyWiped } from '/home/maady/teamwork_projects/prompt_royale/src/logic/gameEngine';
import { PlayerState, BossState } from '/home/maady/teamwork_projects/prompt_royale/src/types/game';

function assert(condition: boolean, message: string) {
  if (!condition) {
    throw new Error(`ASSERTION FAILED: ${message}`);
  }
}

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

console.log('=== STARTING EMPIRICAL ADVERSARIAL STRESS TEST ===');

// 1. Overkill Boss HP
{
  const boss = createMockBoss(30);
  const players = createMockPlayers();
  const res = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A', 4: 'A' }, 'A');
  assert(res.updatedBossHp === 0, 'Boss HP should clamp to 0 on overkill');
  assert(res.bossDamage === 100, 'Boss damage calculated as 100');
  assert(isBossDefeated({ ...boss, hp: res.updatedBossHp }) === true, 'isBossDefeated should return true');
  console.log('[PASS] Test 1: Overkill Boss HP clamping & defeat check');
}

// 2. Overkill Player HP
{
  const boss = createMockBoss(1000);
  const players = createMockPlayers();
  players[0].hp = 10;
  const res = resolveTurnScoring(players, boss, { 1: 'B', 2: 'B', 3: 'B', 4: 'B' }, 'A');
  assert(res.updatedPlayers[0].hp === 0, 'Player HP should clamp to 0');
  assert(res.updatedPlayers[0].isKnockedOut === true, 'Player should be knocked out');
  console.log('[PASS] Test 2: Overkill Player HP clamping & knockout badge');
}

// 3. Negative Boss HP input
{
  const boss = createMockBoss(-50);
  const players = createMockPlayers();
  const res = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A', 4: 'A' }, 'A');
  assert(res.updatedBossHp === 0, 'Negative Boss HP input should clamp to 0');
  assert(isBossDefeated({ ...boss, hp: res.updatedBossHp }) === true, 'Negative Boss HP is defeated');
  console.log('[PASS] Test 3: Negative Boss HP input handling');
}

// 4. Negative Player HP input
{
  const boss = createMockBoss(1000);
  const players = createMockPlayers();
  players[1].hp = -20;
  players[1].isKnockedOut = true;
  const res = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A' }, 'A');
  assert(res.updatedPlayers[1].hp === 0, 'Negative Player HP input should clamp to 0');
  assert(res.updatedPlayers[1].isKnockedOut === true, 'Negative Player HP is knocked out');
  console.log('[PASS] Test 4: Negative Player HP input handling');
}

// 5. All 4 players knocked out
{
  const boss = createMockBoss(1000);
  const players = createMockPlayers().map((p) => ({ ...p, hp: 0, isKnockedOut: true }));
  const res = resolveTurnScoring(players, boss, { 1: 'A', 2: 'A', 3: 'A', 4: 'A' }, 'A');
  assert(res.bossDamage === 0, 'No active voters -> 0 boss damage');
  assert(res.updatedBossHp === 1000, 'Boss HP unchanged when all players knocked out');
  assert(res.updatedPlayers.every((p) => p.hp === 0 && p.isKnockedOut), 'All players remain knocked out at 0 HP');
  assert(isPartyWiped(res.updatedPlayers) === true, 'isPartyWiped returns true when all players knocked out');
  console.log('[PASS] Test 5: All 4 players knocked out handling');
}

// 6. Empty votes record
{
  const boss = createMockBoss(1000);
  const players = createMockPlayers();
  const res = resolveTurnScoring(players, boss, {}, 'A');
  assert(res.bossDamage === 0, '0 correct votes -> 0 boss damage');
  assert(res.playerRecoilDamage === 30, '0 correct votes -> 30 recoil damage');
  assert(res.incorrectPlayerIds.length === 4, 'All 4 players marked incorrect');
  console.log('[PASS] Test 6: Empty votes record handling');
}

// 7. Immutability check
{
  const boss = createMockBoss(1000);
  const players = createMockPlayers();
  const origBossHp = boss.hp;
  const origP1Hp = players[0].hp;
  resolveTurnScoring(players, boss, { 1: 'B', 2: 'B', 3: 'B', 4: 'B' }, 'A');
  assert(boss.hp === origBossHp, 'Input boss object must not be mutated');
  assert(players[0].hp === origP1Hp, 'Input players array/objects must not be mutated');
  console.log('[PASS] Test 7: Input state immutability check');
}

// 8. Stress test: 10,000 randomized turn simulations
{
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
    const res = resolveTurnScoring(players, boss, votes, correctAnswer);

    boss = { ...boss, hp: res.updatedBossHp };
    players = res.updatedPlayers;

    assert(boss.hp >= 0, `Turn ${turn}: Boss HP must be >= 0 (got ${boss.hp})`);
    assert(!Number.isNaN(boss.hp), `Turn ${turn}: Boss HP must not be NaN`);
    players.forEach((p) => {
      assert(p.hp >= 0, `Turn ${turn}: Player ${p.id} HP must be >= 0 (got ${p.hp})`);
      assert(!Number.isNaN(p.hp), `Turn ${turn}: Player ${p.id} HP must not be NaN`);
      if (p.hp === 0) {
        assert(p.isKnockedOut === true, `Turn ${turn}: Player ${p.id} at 0 HP must be knocked out`);
      }
    });
  }
  console.log('[PASS] Test 8: 10,000 randomized turns stress test passed cleanly');
}

console.log('=== ALL EMPIRICAL ADVERSARIAL STRESS TESTS PASSED SUCCESSFULLY ===');
