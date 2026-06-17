'use client';

import { useEffect, useRef, useState } from 'react';
import type { PokemonSummary, Move } from '@/lib/types';
import { useBattle } from '@/hooks/useBattle';
import { useSound } from '@/hooks/useSound';
import { cryUrl } from '@/lib/pokeapi';
import { HpBar } from './HpBar';
import { MoveButton } from './MoveButton';
import { TypeParticles } from './TypeParticles';
import { ConfettiOnWin } from './ConfettiOnWin';
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
}

export function BattleArena({ team, opponents, playerMoves, opponentMoves, onOver }: Props) {
  const [state, dispatch] = useBattle({ team, opponents });
  const [particles, setParticles] = useState(0);
  const [particleType, setParticleType] = useState<Move['type']>('normal');
  const [showSwitch, setShowSwitch] = useState(false);
  const playCry = useSound();
  const prevOppActiveRef = useRef(0);
  const prevPlayerActiveRef = useRef(0);

  const playerMon = state.player.team[state.player.active];
  const oppMon = state.opponent.team[state.opponent.active];

  const myMoves = playerMoves[playerMon.id] ?? [];

  function play(move: Move) {
    if (state.over) return;
    const oppMoveList = opponentMoves[oppMon.id] ?? [];
    if (oppMoveList.length === 0) return;
    const oppMove = oppMoveList[Math.floor(Math.random() * oppMoveList.length)];
    dispatch({ type: 'PLAYER_MOVE', move, oppMove });
    setParticleType(move.type);
    setParticles((n) => n + 1);
    playCry(cryUrl(oppMon.id));
  }

  function switchTo(idx: number) {
    if (idx === state.player.active) return;
    if (state.player.hp[idx] === 0) return;
    dispatch({ type: 'PLAYER_SWITCH', to: idx });
    setShowSwitch(false);
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

  const switchableCount = state.player.team.filter(
    (_, i) => i !== state.player.active && state.player.hp[i] > 0,
  ).length;

  return (
    <section className="grid gap-6 md:grid-cols-2 relative">
      <ConfettiOnWin trigger={state.over && state.winner === 'player'} />
      <TypeParticles trigger={particles} type={particleType} />

      <div className="glass-panel p-4 rounded-lg">
        <p className="text-xs text-white/60 mb-1">Opponent</p>
        <h2 className="capitalize">{oppMon.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={oppMon.sprite} alt={oppMon.name} className="w-40 h-40 object-contain mx-auto" />
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
        <p className="text-xs text-white/60 mb-1">You</p>
        <h2 className="capitalize">{playerMon.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerMon.sprite}
          alt={playerMon.name}
          className="w-40 h-40 object-contain mx-auto"
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

        {!showSwitch && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {myMoves.slice(0, 4).map((m) => (
              <MoveButton key={m.id} move={m} disabled={state.over} onSelect={play} />
            ))}
            {switchableCount > 0 && (
              <Button
                variant="ghost"
                onClick={() => setShowSwitch(true)}
                className="col-span-2"
                disabled={state.over}
              >
                Switch Pokémon ⇆
              </Button>
            )}
          </div>
        )}

        {showSwitch && (
          <div className="mt-4">
            <p className="text-sm text-white/60 mb-2">Pick a Pokémon to switch in:</p>
            <div className="grid grid-cols-3 gap-2">
              {state.player.team.map((p, i) => {
                const isActive = i === state.player.active;
                const fainted = state.player.hp[i] === 0;
                return (
                  <button
                    key={p.id}
                    onClick={() => switchTo(i)}
                    disabled={isActive || fainted}
                    className={`p-2 rounded border ${
                      isActive
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
            <Button variant="ghost" onClick={() => setShowSwitch(false)} className="mt-2 w-full">
              Cancel
            </Button>
          </div>
        )}
      </div>

      {state.over && (
        <div className="md:col-span-2 text-center p-4">
          <p className="text-xl">{state.winner === 'player' ? 'Victory!' : 'Defeated.'}</p>
          <p className="text-sm text-white/60">Score: {state.score}</p>
        </div>
      )}
    </section>
  );
}
