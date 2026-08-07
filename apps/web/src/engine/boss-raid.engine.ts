import { VoteType, VotePayload, DamageReport } from '../types/boss-raid.types';

export class BossRaidEngine {
  private votes: Map<string, VoteType>;
  private phaseActive: boolean;
  private initialBossHealth: number;

  constructor() {
    this.votes = new Map();
    this.phaseActive = true;
    this.initialBossHealth = 10000;
  }

  getInitialBossHealth(): number {
    return this.initialBossHealth;
  }

  castVote(payload: VotePayload): { success: boolean; error?: string } {
    if (!this.phaseActive) {
      return { success: false, error: 'Voting phase has ended' };
    }
    this.votes.set(payload.playerId, payload.vote);
    return { success: true };
  }

  getVotes(playerId: string): VoteType | undefined {
    return this.votes.get(playerId);
  }

  endVotingPhase(): void {
    this.phaseActive = false;
  }

  calculateDamage(): DamageReport {
    let attackCount = 0;
    let defendCount = 0;

    for (const vote of this.votes.values()) {
      if (vote === VoteType.ATTACK) attackCount++;
      if (vote === VoteType.DEFEND) defendCount++;
    }

    const baseDamagePerAttack = 500;
    let comboMultiplier = 1.0;
    
    if (attackCount >= 3) {
      comboMultiplier = 1.5;
    } else if (attackCount === 2) {
      comboMultiplier = 1.2;
    }

    const totalDamageDealt = attackCount * baseDamagePerAttack * comboMultiplier;
    const bossHealthRemaining = this.initialBossHealth - totalDamageDealt;

    const baseBossDamage = 1000;
    const mitigation = defendCount * 200;
    const playerDamageReceived = Math.max(0, baseBossDamage - mitigation);

    return {
      totalDamageDealt,
      bossHealthRemaining,
      comboMultiplier,
      baseBossDamage,
      playerDamageReceived,
    };
  }
}
