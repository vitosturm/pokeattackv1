import { describe, it, expect } from 'vitest';
import { battleReducer, initBattleState } from '@/hooks/useBattle';
import type { PokemonSummary, Move } from '@/lib/types';

const mk = (id: number, name: string, type: 'fire' | 'water' | 'grass'): PokemonSummary => ({
  id,
  name,
  types: [type],
  stats: { hp: 100, attack: 80, defense: 70, specialAttack: 80, specialDefense: 70, speed: 60 },
  sprite: 'x',
});

const move = (type: 'fire' | 'water' | 'grass', power = 80): Move => ({
  id: 1,
  name: 'm',
  type,
  power,
  pp: 20,
  damageClass: 'special',
});

const team = [mk(1, 'a', 'fire'), mk(2, 'b', 'water'), mk(3, 'c', 'grass')];
const opp = [mk(4, 'x', 'grass'), mk(5, 'y', 'fire'), mk(6, 'z', 'water')];

describe('battleReducer', () => {
  it('initialises with full HP and active index 0', () => {
    const s = initBattleState({ team, opponents: opp });
    expect(s.player.active).toBe(0);
    expect(s.player.hp[0]).toBe(100);
    expect(s.opponent.hp[0]).toBe(100);
    expect(s.over).toBe(false);
  });

  it('applies damage on PLAYER_MOVE', () => {
    let s = initBattleState({ team, opponents: opp });
    s = battleReducer(s, {
      type: 'PLAYER_MOVE',
      move: move('fire'),
      rand: () => 1,
      oppRand: () => 1,
      oppMove: move('grass'),
    });
    expect(s.opponent.hp[0]).toBeLessThan(100);
    expect(s.player.hp[0]).toBeLessThan(100);
  });

  it('auto-switches when active Pokémon faints', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, opponent: { ...s.opponent, hp: [0, 100, 100] } };
    s = battleReducer(s, {
      type: 'PLAYER_MOVE',
      move: move('fire'),
      rand: () => 1,
      oppRand: () => 1,
      oppMove: move('grass'),
    });
    expect(s.opponent.active).toBe(1);
  });

  it('ends battle when opponent team fully fainted', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, opponent: { ...s.opponent, hp: [0, 0, 0] } };
    s = battleReducer(s, { type: 'CHECK_OVER' });
    expect(s.over).toBe(true);
    expect(s.winner).toBe('player');
  });

  it('accumulates score across battles', () => {
    let s = initBattleState({ team, opponents: opp, prevScore: 100, prevWins: 1, prevBattles: 1 });
    s = { ...s, opponent: { ...s.opponent, hp: [0, 0, 0] } };
    s = battleReducer(s, { type: 'CHECK_OVER' });
    expect(s.score).toBe(200);
    expect(s.wins).toBe(2);
    expect(s.battles).toBe(2);
  });
});
