'use client';

import { useReducer } from 'react';
import type { PokemonSummary, Move } from '@/lib/types';
import { computeDamage } from '@/lib/damage';

export interface Side {
  team: PokemonSummary[];
  hp: number[];
  active: number;
}

export interface BattleState {
  player: Side;
  opponent: Side;
  log: string[];
  over: boolean;
  winner: 'player' | 'opponent' | null;
  score: number;
  wins: number;
  battles: number;
}

interface Init {
  team: PokemonSummary[];
  opponents: PokemonSummary[];
  prevScore?: number;
  prevWins?: number;
  prevBattles?: number;
}

export function initBattleState(init: Init): BattleState {
  return {
    player: { team: init.team, hp: init.team.map((p) => p.stats.hp), active: 0 },
    opponent: { team: init.opponents, hp: init.opponents.map((p) => p.stats.hp), active: 0 },
    log: [],
    over: false,
    winner: null,
    score: init.prevScore ?? 0,
    wins: init.prevWins ?? 0,
    battles: init.prevBattles ?? 0,
  };
}

export type BattleAction =
  | { type: 'PLAYER_MOVE'; move: Move; oppMove: Move; rand?: () => number; oppRand?: () => number }
  | { type: 'PLAYER_SWITCH'; to: number }
  | { type: 'CHECK_OVER' };

function nextAlive(side: Side): number {
  for (let i = 0; i < side.hp.length; i++) if (side.hp[i] > 0) return i;
  return -1;
}

function applyHit(
  attacker: PokemonSummary,
  defender: PokemonSummary,
  move: Move,
  defenderHp: number,
  rand?: () => number,
): number {
  if (move.damageClass === 'status') return defenderHp;
  const dmg = computeDamage(
    { level: 50, types: attacker.types, stats: attacker.stats },
    { types: defender.types, stats: defender.stats },
    { power: move.power, type: move.type, damageClass: move.damageClass },
    rand,
  );
  return Math.max(0, defenderHp - dmg);
}

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  if (state.over) return state;

  if (action.type === 'PLAYER_SWITCH') {
    if (action.to < 0 || action.to >= state.player.team.length) return state;
    if (state.player.hp[action.to] === 0) return state;
    if (action.to === state.player.active) return state;
    return {
      ...state,
      player: { ...state.player, active: action.to },
    };
  }

  if (action.type === 'PLAYER_MOVE') {
    const pIdx = state.player.active;
    const oIdx = state.opponent.active;
    const playerMon = state.player.team[pIdx];
    const oppMon = state.opponent.team[oIdx];

    // both sides exchange blows in the turn (simplification — fine for bootcamp scope)
    const oppHpAfter = state.opponent.hp.slice();
    oppHpAfter[oIdx] = applyHit(playerMon, oppMon, action.move, oppHpAfter[oIdx], action.rand);

    const playerHpAfter = state.player.hp.slice();
    playerHpAfter[pIdx] = applyHit(
      oppMon,
      playerMon,
      action.oppMove,
      playerHpAfter[pIdx],
      action.oppRand,
    );

    let opponent = { ...state.opponent, hp: oppHpAfter };
    let player = { ...state.player, hp: playerHpAfter };

    if (opponent.hp[opponent.active] === 0) {
      const n = nextAlive(opponent);
      if (n !== -1) opponent = { ...opponent, active: n };
    }
    if (player.hp[player.active] === 0) {
      const n = nextAlive(player);
      if (n !== -1) player = { ...player, active: n };
    }

    const next: BattleState = { ...state, player, opponent };
    return battleReducer(next, { type: 'CHECK_OVER' });
  }

  if (action.type === 'CHECK_OVER') {
    const playerDown = state.player.hp.every((h) => h === 0);
    const oppDown = state.opponent.hp.every((h) => h === 0);
    if (!playerDown && !oppDown) return state;

    const winner: 'player' | 'opponent' = oppDown ? 'player' : 'opponent';
    const battleScore = winner === 'player' ? 100 : 0;
    return {
      ...state,
      over: true,
      winner,
      score: state.score + battleScore,
      wins: state.wins + (winner === 'player' ? 1 : 0),
      battles: state.battles + 1,
    };
  }

  return state;
}

export function useBattle(init: Init) {
  return useReducer(battleReducer, init, initBattleState);
}
