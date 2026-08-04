/**
 * agent-notes: { ctx: "P0 principal SDE, TDD green phase", deps: ["apps/web/test/engine/game-logic.test.ts"], state: "canonical", last: "sato@2026-08-04", key: ["implements game logic"] }
 */
export type PlayerStatus = 'alive' | 'dead';
export type GameStatus = 'active' | 'victory' | 'revive' | 'defeat';

export interface Player {
  id: string;
  hp: number;
  status: PlayerStatus;
}

export interface Boss {
  hp: number;
  maxHp: number;
}

export interface GameState {
  boss: Boss;
  players: Player[];
  status: GameStatus;
}

export interface PlayerVote {
  playerId: string;
  isCorrect: boolean;
}

/**
 * Calculates the results of a round based on player votes.
 */
export function calculateRoundResults(state: GameState, votes: PlayerVote[]): GameState {
  // Create a deep copy to avoid mutating the input state
  const newState: GameState = JSON.parse(JSON.stringify(state));
  
  const correctVotes = votes.filter(v => v.isCorrect).length;
  
  let bossDamage = 0;
  let wrongPlayerDamage = 0;
  let allPlayerDamage = 0;

  switch (correctVotes) {
    case 4:
      bossDamage = 100;
      break;
    case 3:
      bossDamage = 60;
      wrongPlayerDamage = 25;
      break;
    case 2:
      bossDamage = 25;
      wrongPlayerDamage = 25;
      break;
    case 1:
      bossDamage = 10;
      wrongPlayerDamage = 25;
      break;
    case 0:
      bossDamage = 0;
      allPlayerDamage = 30;
      break;
  }

  // Apply boss damage
  newState.boss.hp = Math.max(0, newState.boss.hp - bossDamage);

  // Apply player damage
  for (const player of newState.players) {
    // Players who are already dead don't take further damage
    if (player.status === 'dead') continue;

    const vote = votes.find(v => v.playerId === player.id);
    const isWrong = vote ? !vote.isCorrect : true;

    let damageToTake = 0;
    if (allPlayerDamage > 0) {
      damageToTake = allPlayerDamage;
    } else if (isWrong && wrongPlayerDamage > 0) {
      damageToTake = wrongPlayerDamage;
    }

    player.hp = Math.max(0, player.hp - damageToTake);
    
    if (player.hp === 0) {
      player.status = 'dead';
    }
  }

  // Check state transitions
  if (newState.boss.hp === 0) {
    newState.status = 'victory';
  } else if (newState.players.every(p => p.status === 'dead')) {
    newState.status = 'revive';
  }

  return newState;
}

/**
 * Processes the outcome of a team revive attempt.
 */
export function processRevive(state: GameState, success: boolean): GameState {
  const newState: GameState = JSON.parse(JSON.stringify(state));
  
  if (success) {
    newState.status = 'active';
    newState.players.forEach(p => {
      p.hp = 100;
      p.status = 'alive';
    });
  } else {
    newState.status = 'defeat';
  }
  
  return newState;
}
