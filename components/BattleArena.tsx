'use client';

import { useEffect, useState } from 'react';
import type { PokemonSummary, Move } from '@/lib/types';
import { useBattle } from '@/hooks/useBattle';
import { HpBar } from './HpBar';
import { MoveButton } from './MoveButton';
import { TypeParticles } from './TypeParticles';
import { ConfettiOnWin } from './ConfettiOnWin';

interface Props {
  team: PokemonSummary[];
  opponents: PokemonSummary[];
  playerMoves: Move[];
  opponentMoves: Move[];
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

  const playerMon = state.player.team[state.player.active];
  const oppMon = state.opponent.team[state.opponent.active];

  function play(move: Move) {
    if (state.over) return;
    const oppMove = opponentMoves[Math.floor(Math.random() * opponentMoves.length)];
    dispatch({ type: 'PLAYER_MOVE', move, oppMove });
    setParticleType(move.type);
    setParticles((n) => n + 1);
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

  return (
    <section className="grid gap-6 md:grid-cols-2 relative">
      <ConfettiOnWin trigger={state.over && state.winner === 'player'} />
      <TypeParticles trigger={particles} type={particleType} />

      <div className="bg-[#14141f] p-4 rounded-lg border border-white/10">
        <p className="text-xs text-white/60 mb-1">Opponent</p>
        <h2 className="capitalize">{oppMon.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={oppMon.sprite} alt={oppMon.name} className="w-40 h-40 object-contain mx-auto" />
        <HpBar current={state.opponent.hp[state.opponent.active]} max={oppMon.stats.hp} />
      </div>

      <div className="bg-[#14141f] p-4 rounded-lg border border-white/10">
        <p className="text-xs text-white/60 mb-1">You</p>
        <h2 className="capitalize">{playerMon.name}</h2>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={playerMon.sprite}
          alt={playerMon.name}
          className="w-40 h-40 object-contain mx-auto"
        />
        <HpBar current={state.player.hp[state.player.active]} max={playerMon.stats.hp} />

        <div className="grid grid-cols-2 gap-2 mt-4">
          {playerMoves.slice(0, 4).map((m) => (
            <MoveButton key={m.id} move={m} disabled={state.over} onSelect={play} />
          ))}
        </div>
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
