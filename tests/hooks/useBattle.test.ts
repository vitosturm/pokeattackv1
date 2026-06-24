import { describe, it, expect } from 'vitest';
import { battleReducer, initBattleState } from '@/hooks/useBattle';
import type { PokemonSummary, Move } from '@/lib/types';
import type { PokemonType } from '@/lib/type-chart';

const mk = (id: number, name: string, type: PokemonType): PokemonSummary => ({
  id,
  name,
  types: [type],
  stats: { hp: 100, attack: 80, defense: 70, specialAttack: 80, specialDefense: 70, speed: 60 },
  sprite: 'x',
});

// No accuracy/ailment/highCrit set → always hits, no crit roll consumed below
// 0.0625, no ailment — see Task 3's resolveTurn for why 0.5 is "no surprises".
const move = (type: PokemonType, power = 80): Move => ({
  id: 1,
  name: 'm',
  type,
  power,
  pp: 20,
  damageClass: 'special',
});
const NO_SURPRISES = () => 0.5;

const team = [mk(1, 'a', 'fire'), mk(2, 'b', 'water'), mk(3, 'c', 'grass')];
const opp = [mk(4, 'x', 'grass'), mk(5, 'y', 'fire'), mk(6, 'z', 'water')];

describe('battleReducer', () => {
  it('initialises with full HP, no status, wave 1, and no pending switch', () => {
    const s = initBattleState({ team, opponents: opp });
    expect(s.player.active).toBe(0);
    expect(s.player.hp[0]).toBe(100);
    expect(s.player.status).toEqual([null, null, null]);
    expect(s.opponent.hp[0]).toBe(100);
    expect(s.wave).toBe(1);
    expect(s.over).toBe(false);
    expect(s.mustSwitch).toBe(false);
    expect(s.waveCleared).toBe(false);
  });

  it('applies damage to both sides on PLAYER_MOVE and logs human-readable lines', () => {
    let s = initBattleState({ team, opponents: opp });
    s = battleReducer(s, {
      type: 'PLAYER_MOVE',
      move: move('fire'),
      oppMove: move('grass'),
      rand: NO_SURPRISES,
    });
    expect(s.opponent.hp[0]).toBeLessThan(100);
    expect(s.player.hp[0]).toBeLessThan(100);
    expect(s.log.length).toBeGreaterThan(0);
    expect(s.log.some((line) => /used/i.test(line))).toBe(true);
  });

  it('auto-switches the opponent when its active Pokémon faints', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, opponent: { ...s.opponent, hp: [0, 100, 100] } };
    s = battleReducer(s, {
      type: 'PLAYER_MOVE',
      move: move('fire'),
      oppMove: move('grass'),
      rand: NO_SURPRISES,
    });
    expect(s.opponent.active).toBe(1);
  });

  it('sets mustSwitch instead of auto-switching when the player faints', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, player: { ...s.player, hp: [0, 100, 100] } };
    s = battleReducer(s, {
      type: 'PLAYER_MOVE',
      move: move('fire'),
      oppMove: move('grass'),
      rand: NO_SURPRISES,
    });
    expect(s.player.active).toBe(0); // unchanged — no auto-switch
    expect(s.mustSwitch).toBe(true);
  });

  it('PLAYER_MOVE is a no-op while mustSwitch is true', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, player: { ...s.player, hp: [0, 100, 100] }, mustSwitch: true };
    const before = s;
    s = battleReducer(s, {
      type: 'PLAYER_MOVE',
      move: move('fire'),
      oppMove: move('grass'),
      rand: NO_SURPRISES,
    });
    expect(s).toBe(before);
  });

  it('PLAYER_SWITCH resolves a pending mustSwitch and clears the flag', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, player: { ...s.player, hp: [0, 100, 100] }, mustSwitch: true };
    s = battleReducer(s, { type: 'PLAYER_SWITCH', to: 1 });
    expect(s.player.active).toBe(1);
    expect(s.mustSwitch).toBe(false);
  });

  it('clears a wave when the opponent team is fully fainted, without ending the run', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, opponent: { ...s.opponent, hp: [0, 0, 0] } };
    s = battleReducer(s, { type: 'CHECK_OVER' });
    expect(s.over).toBe(false);
    expect(s.waveCleared).toBe(true);
    expect(s.wins).toBe(1);
    expect(s.battles).toBe(1);
    expect(s.score).toBe(100);
  });

  it('ends the run when the player team is fully fainted', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, player: { ...s.player, hp: [0, 0, 0] } };
    s = battleReducer(s, { type: 'CHECK_OVER' });
    expect(s.over).toBe(true);
    expect(s.winner).toBe('opponent');
    expect(s.battles).toBe(1);
    expect(s.wins).toBe(0);
  });

  it('counts a simultaneous wipe as one cleared wave, then ends the run (no double-count)', () => {
    let s = initBattleState({ team, opponents: opp });
    s = {
      ...s,
      player: { ...s.player, hp: [0, 0, 0] },
      opponent: { ...s.opponent, hp: [0, 0, 0] },
    };
    s = battleReducer(s, { type: 'CHECK_OVER' });
    expect(s.over).toBe(true);
    expect(s.winner).toBe('opponent');
    expect(s.wins).toBe(1);
    expect(s.battles).toBe(1);
  });

  it('ignores actions once the run is over', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, over: true, winner: 'opponent' };
    const before = s;
    s = battleReducer(s, { type: 'PLAYER_SWITCH', to: 1 });
    expect(s).toBe(before);
  });

  it('ignores actions while a wave-clear is pending START_NEXT_WAVE', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, waveCleared: true };
    const before = s;
    s = battleReducer(s, { type: 'PLAYER_SWITCH', to: 1 });
    expect(s).toBe(before);
  });

  it('START_NEXT_WAVE installs a fresh opponent team, increments wave, clears waveCleared', () => {
    let s = initBattleState({ team, opponents: opp });
    s = { ...s, player: { ...s.player, hp: [40, 100, 100] }, waveCleared: true };
    const freshOpponents = [mk(7, 'p', 'psychic'), mk(8, 'q', 'rock'), mk(9, 'r', 'bug')];
    s = battleReducer(s, { type: 'START_NEXT_WAVE', opponents: freshOpponents });
    expect(s.waveCleared).toBe(false);
    expect(s.wave).toBe(2);
    expect(s.opponent.team).toBe(freshOpponents);
    expect(s.opponent.hp).toEqual([100, 100, 100]);
    expect(s.opponent.active).toBe(0);
    expect(s.player.hp[0]).toBe(40); // carried over, no healing between waves
  });

  it('accumulates score/wins/battles across waves via prevScore/prevWins/prevBattles', () => {
    let s = initBattleState({ team, opponents: opp, prevScore: 100, prevWins: 1, prevBattles: 1 });
    s = { ...s, opponent: { ...s.opponent, hp: [0, 0, 0] } };
    s = battleReducer(s, { type: 'CHECK_OVER' });
    expect(s.score).toBe(200);
    expect(s.wins).toBe(2);
    expect(s.battles).toBe(2);
  });
});
