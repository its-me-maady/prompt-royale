export enum VoteType {
  ATTACK = 'ATTACK',
  DEFEND = 'DEFEND',
  HEAL = 'HEAL',
}

export interface VotePayload {
  playerId: string;
  vote: VoteType;
}

export interface DamageReport {
  totalDamageDealt: number;
  bossHealthRemaining: number;
  comboMultiplier: number;
  baseBossDamage: number;
  playerDamageReceived: number;
}
