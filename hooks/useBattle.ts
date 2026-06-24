'use client';

import { useReducer } from 'react';
import type { PokemonSummary, Move, StatusCondition } from '@/lib/types';
import { resolveTurn, type TurnEvent } from '@/lib/battle-engine';

export interface Side {
  team: PokemonSummary[];
  hp: number[];
  status: (StatusCondition | null)[];
  active: number;
}

export interface BattleState {
  player: Side;
  opponent: Side;
  log: string[];
  lastEvents: TurnEvent[];
  mustSwitch: boolean;
  waveCleared: boolean;
  wave: number;
  over: boolean;
  // 'player' is type-valid but never produced — see Task 4 of the battle
  // excitement plan: under the gauntlet model the run only ever ends in
  // defeat (opponents are an endless supply), so `over` only becomes true
  // when the player's team is wiped. Kept so app/battle/page.tsx's existing
  // `winner === 'player' ? 'VICTORY!' : 'DEFEATED'` ternary keeps compiling.
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
    player: {
      team: init.team,
      hp: init.team.map((p) => p.stats.hp),
      status: init.team.map(() => null),
      active: 0,
    },
    opponent: {
      team: init.opponents,
      hp: init.opponents.map((p) => p.stats.hp),
      status: init.opponents.map(() => null),
      active: 0,
    },
    log: [],
    lastEvents: [],
    mustSwitch: false,
    waveCleared: false,
    wave: 1,
    over: false,
    winner: null,
    score: init.prevScore ?? 0,
    wins: init.prevWins ?? 0,
    battles: init.prevBattles ?? 0,
  };
}

export type BattleAction =
  | { type: 'PLAYER_MOVE'; move: Move; oppMove: Move; rand?: () => number }
  | { type: 'PLAYER_SWITCH'; to: number }
  | { type: 'START_NEXT_WAVE'; opponents: PokemonSummary[] }
  | { type: 'CHECK_OVER' };

function nextAlive(side: Side): number {
  for (let i = 0; i < side.hp.length; i++) if (side.hp[i] > 0) return i;
  return -1;
}

function describeEvent(event: TurnEvent, playerName: string, oppName: string): string | null {
  const name = event.side === 'player' ? playerName : oppName;
  switch (event.kind) {
    case 'move':
      return `${name} used ${event.moveName.replace(/-/g, ' ')}!`;
    case 'miss':
      return `${name}'s attack missed!`;
    case 'hit':
      if (event.effectiveness === 'immune') return "It doesn't affect the foe...";
      if (event.crit) return 'Critical hit!';
      if (event.effectiveness === 'super') return "It's super effective!";
      if (event.effectiveness === 'resisted') return "It's not very effective...";
      return null;
    case 'status-blocked':
      return `${name} is paralyzed and can't move!`;
    case 'status-applied':
      return `${name} was ${
        event.status === 'burn' ? 'burned' : event.status === 'poison' ? 'poisoned' : 'paralyzed'
      }!`;
    case 'status-damage':
      return `${name} is hurt by ${event.status}!`;
    default:
      return null;
  }
}

export function battleReducer(state: BattleState, action: BattleAction): BattleState {
  if (state.over) return state;
  if (action.type !== 'START_NEXT_WAVE' && state.waveCleared) return state;

  if (action.type === 'PLAYER_SWITCH') {
    if (action.to < 0 || action.to >= state.player.team.length) return state;
    if (state.player.hp[action.to] === 0) return state;
    if (!state.mustSwitch && action.to === state.player.active) return state;
    return { ...state, player: { ...state.player, active: action.to }, mustSwitch: false };
  }

  if (action.type === 'START_NEXT_WAVE') {
    return {
      ...state,
      waveCleared: false,
      wave: state.wave + 1,
      opponent: {
        team: action.opponents,
        hp: action.opponents.map((p) => p.stats.hp),
        status: action.opponents.map(() => null),
        active: 0,
      },
    };
  }

  if (action.type === 'PLAYER_MOVE') {
    if (state.mustSwitch) return state;
    const pIdx = state.player.active;
    const oIdx = state.opponent.active;
    const playerMon = state.player.team[pIdx];
    const oppMon = state.opponent.team[oIdx];

    const result = resolveTurn({
      player: {
        mon: playerMon,
        move: action.move,
        hp: state.player.hp[pIdx],
        status: state.player.status[pIdx],
      },
      opponent: {
        mon: oppMon,
        move: action.oppMove,
        hp: state.opponent.hp[oIdx],
        status: state.opponent.status[oIdx],
      },
      rand: action.rand,
    });

    const playerHp = state.player.hp.slice();
    playerHp[pIdx] = result.playerHp;
    const playerStatus = state.player.status.slice();
    playerStatus[pIdx] = result.playerStatus;

    const oppHp = state.opponent.hp.slice();
    oppHp[oIdx] = result.oppHp;
    const oppStatus = state.opponent.status.slice();
    oppStatus[oIdx] = result.oppStatus;

    const log = [
      ...state.log,
      ...result.events
        .map((e) => describeEvent(e, playerMon.name, oppMon.name))
        .filter((line): line is string => line !== null),
    ];

    const player: Side = { ...state.player, hp: playerHp, status: playerStatus };
    let opponent: Side = { ...state.opponent, hp: oppHp, status: oppStatus };
    let mustSwitch = false;

    if (oppHp[oIdx] === 0) {
      log.push(`${oppMon.name} fainted!`);
      const n = nextAlive(opponent);
      if (n !== -1) opponent = { ...opponent, active: n };
    }
    if (playerHp[pIdx] === 0) {
      log.push(`${playerMon.name} fainted!`);
      mustSwitch = true;
    }

    const next: BattleState = {
      ...state,
      player,
      opponent,
      log,
      lastEvents: result.events,
      mustSwitch,
    };
    return battleReducer(next, { type: 'CHECK_OVER' });
  }

  if (action.type === 'CHECK_OVER') {
    const playerDown = state.player.hp.every((h) => h === 0);
    const oppDown = state.opponent.hp.every((h) => h === 0);

    let next = state;
    if (oppDown) {
      next = {
        ...next,
        waveCleared: true,
        wins: next.wins + 1,
        battles: next.battles + 1,
        score: next.score + 100,
      };
    }
    if (playerDown) {
      next = {
        ...next,
        over: true,
        winner: 'opponent',
        battles: oppDown ? next.battles : next.battles + 1,
      };
    }
    return next;
  }

  return state;
}

export function useBattle(init: Init) {
  return useReducer(battleReducer, init, initBattleState);
}
