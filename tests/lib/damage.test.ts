import { describe, it, expect } from 'vitest';
import { computeDamage } from '@/lib/damage';

const attacker = {
  level: 50,
  types: ['water'] as const,
  stats: { attack: 100, specialAttack: 100 },
};
const defender = {
  types: ['fire'] as const,
  stats: { defense: 100, specialDefense: 100 },
};

describe('computeDamage', () => {
  it('applies STAB when attacker shares the move type', () => {
    const noStab = computeDamage(
      attacker,
      defender,
      { power: 80, type: 'normal', damageClass: 'special' },
      () => 1,
    );
    const stab = computeDamage(
      attacker,
      defender,
      { power: 80, type: 'water', damageClass: 'special' },
      () => 1,
    );
    expect(stab).toBeGreaterThan(noStab);
  });
  it('applies type effectiveness (water → fire is super-effective)', () => {
    const dmg = computeDamage(
      attacker,
      defender,
      { power: 80, type: 'water', damageClass: 'special' },
      () => 1,
    );
    expect(dmg).toBeGreaterThan(40);
  });
  it('returns 0 when immune', () => {
    const ghost = { types: ['ghost'] as const, stats: { defense: 100, specialDefense: 100 } };
    const dmg = computeDamage(
      attacker,
      ghost,
      { power: 80, type: 'normal', damageClass: 'physical' },
      () => 1,
    );
    expect(dmg).toBe(0);
  });
  it('floors at 1 for non-immune hits', () => {
    const tank = { types: ['steel'] as const, stats: { defense: 9999, specialDefense: 9999 } };
    const dmg = computeDamage(
      attacker,
      tank,
      { power: 10, type: 'normal', damageClass: 'physical' },
      () => 0.85,
    );
    expect(dmg).toBeGreaterThanOrEqual(1);
  });
  it('uses physical attack/defense for physical moves', () => {
    const physAtk = { ...attacker, stats: { attack: 200, specialAttack: 50 } };
    const dmg = computeDamage(
      physAtk,
      defender,
      { power: 80, type: 'water', damageClass: 'physical' },
      () => 1,
    );
    expect(dmg).toBeGreaterThan(20);
  });
});
