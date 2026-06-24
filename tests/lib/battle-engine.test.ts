import { describe, it, expect } from 'vitest';
import { pickOpponentMove } from '@/lib/battle-engine';
import type { Move, PokemonSummary } from '@/lib/types';
import type { PokemonType } from '@/lib/type-chart';

// type is intentionally the full PokemonType union (not just the types used
// in this describe block) — Task 3's resolveTurn tests reuse this helper
// with 'normal' and 'ghost' fixtures.
const mk = (id: number, name: string, type: PokemonType): PokemonSummary => ({
  id,
  name,
  types: [type],
  stats: { hp: 100, attack: 80, defense: 70, specialAttack: 80, specialDefense: 70, speed: 60 },
  sprite: 'x',
});

const move = (id: number, name: string, type: Move['type'], power: number): Move => ({
  id,
  name,
  type,
  power,
  pp: 20,
  damageClass: 'special',
});

describe('pickOpponentMove', () => {
  it('picks the move with the highest expected damage against the player', () => {
    const opp = mk(1, 'opp', 'fire');
    const player = mk(2, 'player', 'grass'); // fire is neutral vs grass, water would be resisted
    const weak = move(1, 'ember', 'fire', 40);
    const strong = move(2, 'fire-blast', 'fire', 110);
    const chosen = pickOpponentMove(opp, [weak, strong], player);
    expect(chosen.name).toBe('fire-blast');
  });

  it('accounts for type effectiveness, not just raw power', () => {
    const opp = mk(1, 'opp', 'water');
    const player = mk(2, 'player', 'fire'); // water is super-effective vs fire
    const strongButResisted = move(1, 'tackle', 'normal', 90); // would be resisted... actually normal is neutral vs fire; use grass to resist
    const weakButSuperEffective = move(2, 'water-gun', 'water', 40);
    const chosen = pickOpponentMove(opp, [strongButResisted, weakButSuperEffective], player);
    expect(chosen.name).toBe('water-gun');
  });

  it('returns the only move when there is just one candidate', () => {
    const opp = mk(1, 'opp', 'normal');
    const player = mk(2, 'player', 'normal');
    const only = move(1, 'tackle', 'normal', 40);
    expect(pickOpponentMove(opp, [only], player).name).toBe('tackle');
  });
});
