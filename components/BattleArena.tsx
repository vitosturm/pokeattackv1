'use client';

import { useEffect, useRef, useReducer } from 'react';
import type { PokemonSummary, Move } from '@/lib/types';
import { useBattle } from '@/hooks/useBattle';
import { useSound } from '@/hooks/useSound';
import { cryUrl } from '@/lib/pokeapi';
import { pickOpponentMove, type TurnEvent } from '@/lib/battle-engine';
import { playCritSound, playFaintSound, playStatusSound } from '@/lib/sfx';
import { HpBar } from './HpBar';
import { MoveButton } from './MoveButton';
import { TypeParticles } from './TypeParticles';
import { BattleLog } from './BattleLog';
import { Button } from '@/components/ui/button';
import './glass-card.css';

interface Props {
  team: PokemonSummary[];
  opponents: PokemonSummary[];
  playerMoves: Record<number, Move[]>;
  opponentMoves: Record<number, Move[]>;
  onOver?: (result: {
    score: number;
    wins: number;
    battles: number;
    winner: 'player' | 'opponent';
  }) => void;
  onWaveClear?: () => Promise<{
    opponents: PokemonSummary[];
    opponentMoves: Record<number, Move[]>;
  }>;
  onWaveChange?: (wave: number) => void;
}

type Intensity = 'miss' | 'weak' | 'normal' | 'strong';

function effectivenessToIntensity(eff: 'super' | 'normal' | 'resisted' | 'immune'): Intensity {
  if (eff === 'immune') return 'miss';
  if (eff === 'super') return 'strong';
  if (eff === 'resisted') return 'weak';
  return 'normal';
}

type Outcome = Extract<TurnEvent, { kind: 'hit' }> | Extract<TurnEvent, { kind: 'miss' }> | null;

function describeOutcome(events: TurnEvent[], side: 'player' | 'opponent'): Outcome {
  for (const e of events) {
    if (e.side !== side) continue;
    if (e.kind === 'hit') return e;
    if (e.kind === 'miss') return e;
  }
  return null;
}

// All per-turn visual state in one object → single dispatch avoids cascading renders.
interface VisualState {
  particleTrigger: number;
  particleType: Move['type'];
  particleIntensity: Intensity;
  flashPlayer: boolean;
  flashOpponent: boolean;
  dodgePlayer: boolean;
  dodgeOpponent: boolean;
  shake: boolean;
}

const INITIAL_VISUAL: VisualState = {
  particleTrigger: 0,
  particleType: 'normal',
  particleIntensity: 'normal',
  flashPlayer: false,
  flashOpponent: false,
  dodgePlayer: false,
  dodgeOpponent: false,
  shake: false,
};

type VisualAction =
  | { type: 'TURN_FX'; patch: Partial<VisualState> }
  | { type: 'CLEAR_FX' }
  | { type: 'SET_PARTICLE_TYPE'; particleType: Move['type'] };

function visualReducer(state: VisualState, action: VisualAction): VisualState {
  if (action.type === 'TURN_FX') return { ...state, ...action.patch };
  if (action.type === 'CLEAR_FX')
    return {
      ...state,
      flashPlayer: false,
      flashOpponent: false,
      dodgePlayer: false,
      dodgeOpponent: false,
      shake: false,
    };
  if (action.type === 'SET_PARTICLE_TYPE') return { ...state, particleType: action.particleType };
  return state;
}

export function BattleArena({
  team,
  opponents,
  playerMoves,
  opponentMoves,
  onOver,
  onWaveClear,
  onWaveChange,
}: Props) {
  const [state, dispatch] = useBattle({ team, opponents });
  const [oppMovesMap, dispatchOppMoves] = useReducer(
    (prev: Record<number, Move[]>, next: Record<number, Move[]>) => ({ ...prev, ...next }),
    opponentMoves,
  );
  const [showSwitch, dispatchShowSwitch] = useReducer((_: boolean, v: boolean) => v, false);
  const [vis, dispatchVis] = useReducer(visualReducer, INITIAL_VISUAL);
  const playCry = useSound();
  const prevOppActiveRef = useRef(0);
  const prevPlayerActiveRef = useRef(0);
  const prevLogLengthRef = useRef(0);
  // Track particleTrigger in a ref to avoid including vis in the lastEvents effect deps
  const particleTriggerRef = useRef(0);

  const playerMon = state.player.team[state.player.active];
  const oppMon = state.opponent.team[state.opponent.active];
  const myMoves = playerMoves[playerMon.id] ?? [];

  function play(move: Move) {
    if (state.over || state.waveCleared || state.mustSwitch) return;
    const oppMoveList = oppMovesMap[oppMon.id] ?? [];
    if (oppMoveList.length === 0) return;
    const oppMove = pickOpponentMove(oppMon, oppMoveList, playerMon);
    dispatch({ type: 'PLAYER_MOVE', move, oppMove });
    playCry(cryUrl(oppMon.id));
    dispatchVis({ type: 'SET_PARTICLE_TYPE', particleType: move.type });
  }

  function switchTo(idx: number) {
    if (!state.mustSwitch && idx === state.player.active) return;
    if (state.player.hp[idx] === 0) return;
    dispatch({ type: 'PLAYER_SWITCH', to: idx });
    dispatchShowSwitch(false);
  }

  useEffect(() => {
    if (state.over && onOver && state.winner) {
      onOver({
        score: state.score,
        wins: state.wins,
        battles: state.battles,
        winner: state.winner,
      });
    }
  }, [state.over, state.winner, state.score, state.wins, state.battles, onOver]);

  useEffect(() => {
    if (prevPlayerActiveRef.current !== state.player.active) {
      playCry(cryUrl(state.player.team[state.player.active].id));
      prevPlayerActiveRef.current = state.player.active;
    }
  }, [state.player.active, state.player.team, playCry]);

  useEffect(() => {
    if (prevOppActiveRef.current !== state.opponent.active) {
      playCry(cryUrl(state.opponent.team[state.opponent.active].id));
      prevOppActiveRef.current = state.opponent.active;
    }
  }, [state.opponent.active, state.opponent.team, playCry]);

  // Drives every per-turn reaction (sprite flash/dodge/shake, particle
  // intensity, sfx, log-driven faint sound) from one place, keyed off the
  // reducer's lastEvents — this is the single source of truth for "what
  // happened" that the spec's design called for.
  useEffect(() => {
    if (state.lastEvents.length === 0) return;
    const playerOutcome = describeOutcome(state.lastEvents, 'player');
    const oppOutcome = describeOutcome(state.lastEvents, 'opponent');

    const patch: Partial<VisualState> = {};

    if (playerOutcome?.kind === 'hit') {
      patch.flashOpponent = true;
      if (playerOutcome.crit) patch.shake = true;
      patch.particleIntensity = effectivenessToIntensity(playerOutcome.effectiveness);
      particleTriggerRef.current += 1;
      patch.particleTrigger = particleTriggerRef.current;
    } else if (playerOutcome?.kind === 'miss') {
      patch.dodgeOpponent = true;
      patch.particleIntensity = 'miss';
      particleTriggerRef.current += 1;
      patch.particleTrigger = particleTriggerRef.current;
    }
    if (oppOutcome?.kind === 'hit') {
      patch.flashPlayer = true;
      if (oppOutcome.crit) patch.shake = true;
    } else if (oppOutcome?.kind === 'miss') {
      patch.dodgePlayer = true;
    }

    dispatchVis({ type: 'TURN_FX', patch });

    if (patch.shake) playCritSound();
    const newLines = state.log.slice(prevLogLengthRef.current);
    prevLogLengthRef.current = state.log.length;
    if (newLines.some((l) => l.includes('fainted!'))) playFaintSound();
    for (const e of state.lastEvents) {
      if (e.kind === 'status-applied') playStatusSound(e.status);
    }

    const t = setTimeout(() => dispatchVis({ type: 'CLEAR_FX' }), 350);
    return () => clearTimeout(t);
  }, [state.lastEvents, state.log, playCritSound, playFaintSound, playStatusSound]);

  useEffect(() => {
    if (!state.waveCleared || !onWaveClear) return;
    let cancelled = false;
    onWaveClear().then(({ opponents: nextOpponents, opponentMoves: nextMoves }) => {
      if (cancelled) return;
      dispatchOppMoves(nextMoves);
      dispatch({ type: 'START_NEXT_WAVE', opponents: nextOpponents });
    });
    return () => {
      cancelled = true;
    };
  }, [state.waveCleared, onWaveClear, dispatch]);

  useEffect(() => {
    onWaveChange?.(state.wave);
  }, [state.wave, onWaveChange]);

  const switchableCount = state.player.team.filter(
    (_, i) => i !== state.player.active && state.player.hp[i] > 0,
  ).length;

  return (
    <section className={`grid gap-6 md:grid-cols-2 relative ${vis.shake ? 'battle-shake' : ''}`}>
      <TypeParticles
        trigger={vis.particleTrigger}
        type={vis.particleType}
        intensity={vis.particleIntensity}
      />

      <div className="glass-panel p-4 rounded-lg">
        <p className="text-xs text-white/60 mb-1">Opponent</p>
        <h2 className="capitalize">{oppMon.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={oppMon.sprite}
          alt={oppMon.name}
          className={`w-40 h-40 object-contain mx-auto ${vis.flashOpponent ? 'sprite-flash' : ''} ${vis.dodgeOpponent ? 'sprite-dodge' : ''}`}
        />
        <HpBar current={state.opponent.hp[state.opponent.active]} max={oppMon.stats.hp} />
        <div className="mt-3 flex gap-1 justify-center">
          {state.opponent.team.map((p, i) => (
            <span
              key={p.id}
              className={`h-2 w-6 rounded-full ${state.opponent.hp[i] === 0 ? 'bg-white/10' : 'bg-[#ff3860]/70'}`}
              title={`${p.name} (${state.opponent.hp[i]}/${p.stats.hp})`}
            />
          ))}
        </div>
      </div>

      <div className="glass-panel p-4 rounded-lg">
        <p className="text-xs text-white/60 mb-1">You · Wave {state.wave}</p>
        <h2 className="capitalize">{playerMon.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerMon.sprite}
          alt={playerMon.name}
          className={`w-40 h-40 object-contain mx-auto ${vis.flashPlayer ? 'sprite-flash' : ''} ${vis.dodgePlayer ? 'sprite-dodge' : ''}`}
        />
        <HpBar current={state.player.hp[state.player.active]} max={playerMon.stats.hp} />
        <div className="mt-3 flex gap-1 justify-center">
          {state.player.team.map((p, i) => (
            <span
              key={p.id}
              className={`h-2 w-6 rounded-full ${state.player.hp[i] === 0 ? 'bg-white/10' : i === state.player.active ? 'bg-green-500' : 'bg-green-500/40'}`}
              title={`${p.name} (${state.player.hp[i]}/${p.stats.hp})`}
            />
          ))}
        </div>

        {!showSwitch && !state.mustSwitch && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {myMoves.slice(0, 4).map((m) => (
              <MoveButton
                key={m.id}
                move={m}
                disabled={state.over || state.waveCleared}
                onSelect={play}
              />
            ))}
            {switchableCount > 0 && (
              <Button
                variant="ghost"
                onClick={() => dispatchShowSwitch(true)}
                className="col-span-2"
                disabled={state.over || state.waveCleared}
              >
                Switch Pokémon ⇆
              </Button>
            )}
          </div>
        )}

        {(showSwitch || state.mustSwitch) && (
          <div className="mt-4">
            <p className="text-sm text-white/60 mb-2">
              {state.mustSwitch
                ? `${playerMon.name} fainted! Choose your next Pokémon:`
                : 'Pick a Pokémon to switch in:'}
            </p>
            <div className="grid grid-cols-3 gap-2">
              {state.player.team.map((p, i) => {
                const isActive = i === state.player.active;
                const fainted = state.player.hp[i] === 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => switchTo(i)}
                    disabled={(isActive && !state.mustSwitch) || fainted}
                    className={`p-2 rounded border ${
                      isActive && !state.mustSwitch
                        ? 'bg-white/10 border-white/20'
                        : fainted
                          ? 'opacity-40 border-white/5'
                          : 'border-white/15 hover:bg-white/5'
                    }`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.sprite} alt={p.name} className="w-16 h-16 object-contain mx-auto" />
                    <p className="text-xs capitalize">{p.name}</p>
                    <p className="text-[10px] text-white/60">
                      {state.player.hp[i]}/{p.stats.hp}
                    </p>
                  </button>
                );
              })}
            </div>
            {!state.mustSwitch && (
              <Button
                variant="ghost"
                onClick={() => dispatchShowSwitch(false)}
                className="mt-2 w-full"
              >
                Cancel
              </Button>
            )}
          </div>
        )}
      </div>

      <div className="md:col-span-2">
        <BattleLog lines={state.log} />
      </div>

      {state.waveCleared && (
        <div className="md:col-span-2 text-center p-4 text-sm text-white/70">
          Wave {state.wave} cleared! Loading next opponents…
        </div>
      )}

      {state.over && (
        <div className="md:col-span-2 text-center p-4">
          <p className="text-xl">{state.winner === 'player' ? 'Victory!' : 'Defeated.'}</p>
          <p className="text-sm text-white/60">Score: {state.score}</p>
        </div>
      )}
    </section>
  );
}
