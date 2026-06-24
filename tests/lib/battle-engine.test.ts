import { describe, it, expect } from 'vitest';
import { pickOpponentMove, resolveTurn } from '@/lib/battle-engine';
import type { Move, PokemonSummary, StatusCondition } from '@/lib/types';
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

function sequence(...values: number[]): () => number {
  let i = 0;
  return () => values[Math.min(i++, values.length - 1)];
}

describe('resolveTurn', () => {
  it('deals damage to both sides on a normal, non-crit, no-status exchange', () => {
    const player = mk(1, 'a', 'normal');
    const opponent = mk(2, 'b', 'normal');
    const tackle = move(1, 'tackle', 'normal', 40);
    tackle.accuracy = 100;
    const result = resolveTurn({
      player: { mon: player, move: tackle, hp: 100, status: null },
      opponent: { mon: opponent, move: tackle, hp: 100, status: null },
      rand: sequence(0, 0.5, 0.5, 0, 0.5, 0.5), // [acc, crit, variance] x2 sides
    });
    expect(result.playerHp).toBeLessThan(100);
    expect(result.oppHp).toBeLessThan(100);
    const playerHit = result.events.find((e) => e.kind === 'hit' && e.side === 'player');
    expect(playerHit).toMatchObject({ crit: false, effectiveness: 'normal' });
  });

  it('registers a miss when the accuracy roll fails, dealing no damage', () => {
    const player = mk(1, 'a', 'normal');
    const opponent = mk(2, 'b', 'normal');
    const lowAccuracy = move(1, 'iffy-move', 'normal', 90);
    lowAccuracy.accuracy = 50;
    const alwaysHits = move(2, 'sure-move', 'normal', 40); // no accuracy field = always hits
    const result = resolveTurn({
      player: { mon: player, move: lowAccuracy, hp: 100, status: null },
      opponent: { mon: opponent, move: alwaysHits, hp: 100, status: null },
      rand: sequence(0.99, 0.99, 0.5), // player's accuracy roll fails (99 >= 50)
    });
    expect(result.events).toContainEqual({ kind: 'miss', side: 'player' });
    expect(result.oppHp).toBe(100);
  });

  it('a critical hit deals more damage than a non-critical hit, all else equal', () => {
    const player = mk(1, 'a', 'normal');
    const opponent = mk(2, 'b', 'normal');
    const tackle = move(1, 'tackle', 'normal', 40);
    tackle.accuracy = 100;
    const harmless = move(2, 'splash', 'normal', 0);
    harmless.damageClass = 'status';
    const critRun = resolveTurn({
      player: { mon: player, move: tackle, hp: 100, status: null },
      opponent: { mon: opponent, move: harmless, hp: 100, status: null },
      rand: sequence(0, 0, 0.5), // accuracy hit, crit roll succeeds (0 < 0.0625), variance
    });
    const noCritRun = resolveTurn({
      player: { mon: player, move: tackle, hp: 100, status: null },
      opponent: { mon: opponent, move: harmless, hp: 100, status: null },
      rand: sequence(0, 0.5, 0.5), // accuracy hit, crit roll fails, same variance
    });
    const critHit = critRun.events.find((e) => e.kind === 'hit' && e.side === 'player');
    const noCritHit = noCritRun.events.find((e) => e.kind === 'hit' && e.side === 'player');
    expect(critHit).toMatchObject({ crit: true });
    expect(noCritHit).toMatchObject({ crit: false });
    expect((critHit as { damage: number }).damage).toBeGreaterThan(
      (noCritHit as { damage: number }).damage,
    );
  });

  it('fully blocks the attacker when an existing paralysis triggers', () => {
    const player = mk(1, 'a', 'normal');
    const opponent = mk(2, 'b', 'normal');
    const tackle = move(1, 'tackle', 'normal', 40);
    tackle.accuracy = 100;
    const result = resolveTurn({
      player: { mon: player, move: tackle, hp: 100, status: 'paralysis' as StatusCondition },
      opponent: { mon: opponent, move: tackle, hp: 100, status: null },
      rand: sequence(0, 0, 0.5, 0.5), // [player: paralysis-block succeeds] [opp: acc, crit-no, variance]
    });
    expect(result.events).toContainEqual({ kind: 'status-blocked', side: 'player' });
    expect(result.events.some((e) => e.kind === 'move' && e.side === 'player')).toBe(false);
    expect(result.oppHp).toBe(100);
  });

  it('only inflicts a new status when the target has no existing status', () => {
    const player = mk(1, 'a', 'normal');
    const opponent = mk(2, 'b', 'normal');
    const paralyzer = move(1, 'body-slam', 'normal', 85);
    paralyzer.accuracy = 100;
    paralyzer.ailment = 'paralysis';
    paralyzer.ailmentChance = 100;
    const harmless = move(2, 'splash', 'normal', 0);
    harmless.damageClass = 'status';
    const result = resolveTurn({
      player: { mon: player, move: paralyzer, hp: 100, status: null },
      opponent: { mon: opponent, move: harmless, hp: 100, status: 'burn' as StatusCondition },
      rand: sequence(0, 0.5, 0.5), // [acc, crit-no, variance] — ailment roll is never reached:
      // defender.status === null is false (it's 'burn'), so the ailment branch
      // short-circuits before calling rand() at all. opponent's status move
      // (harmless) also consumes nothing — see the damageClass==='status' guard.
    });
    expect(result.events.some((e) => e.kind === 'status-applied')).toBe(false);
    expect(result.oppStatus).toBe('burn');
  });

  it('applies end-of-turn residual burn damage based on the pre-turn status', () => {
    const player = mk(1, 'a', 'normal');
    player.stats = { ...player.stats, hp: 100 };
    const opponent = mk(2, 'b', 'normal');
    const missingMove = move(1, 'iffy', 'normal', 90);
    missingMove.accuracy = 1;
    const result = resolveTurn({
      player: { mon: player, move: missingMove, hp: 50, status: 'burn' as StatusCondition },
      opponent: { mon: opponent, move: missingMove, hp: 100, status: null },
      rand: sequence(0.9, 0.9), // both sides' accuracy rolls fail (90 >= 1)
    });
    expect(result.events).toContainEqual({
      kind: 'status-damage',
      side: 'player',
      damage: 6, // floor(100 * 1/16)
      status: 'burn',
    });
    expect(result.playerHp).toBe(44); // 50 - 6, opponent's attack missed
  });

  it('treats an immune (0x) matchup as zero damage with no crit and no status roll', () => {
    const player = mk(1, 'a', 'normal');
    const immuneTarget = mk(9, 'ghost-mon', 'ghost');
    const normalMove = move(1, 'tackle', 'normal', 40); // normal is 0x vs ghost
    const harmless = move(2, 'splash', 'normal', 0);
    harmless.damageClass = 'status';
    const result = resolveTurn({
      player: { mon: player, move: normalMove, hp: 100, status: null },
      opponent: { mon: immuneTarget, move: harmless, hp: 100, status: null },
      rand: sequence(0.9), // only consumed by filler; immune attack consumes nothing
    });
    const playerHit = result.events.find((e) => e.kind === 'hit' && e.side === 'player');
    expect(playerHit).toMatchObject({ damage: 0, crit: false, effectiveness: 'immune' });
    expect(result.oppHp).toBe(100);
  });
});
