export type PlayerStatus = 'alive' | 'dead';

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

  return newState;
}
