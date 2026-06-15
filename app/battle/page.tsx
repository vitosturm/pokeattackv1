'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRoster } from '@/hooks/useRoster';
import { getMove, getPokemon, randomGen1Ids } from '@/lib/pokeapi';
import type { Move, PokemonSummary } from '@/lib/types';
import { BattleArena } from '@/components/BattleArena';
import { submitScore } from '@/app/actions/leaderboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

const PLAYER_MOVE_NAMES = ['water-gun', 'ember', 'vine-whip', 'thunderbolt'];
const OPP_MOVE_NAMES = ['tackle', 'scratch', 'bite', 'gust'];

export default function BattlePage() {
  const router = useRouter();
  const { roster } = useRoster();
  const [opponents, setOpponents] = useState<PokemonSummary[]>([]);
  const [playerMoves, setPlayerMoves] = useState<Move[]>([]);
  const [oppMoves, setOppMoves] = useState<Move[]>([]);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function init() {
      const ids = randomGen1Ids(3);
      const [opps, pm, om] = await Promise.all([
        Promise.all(ids.map(getPokemon)),
        Promise.all(PLAYER_MOVE_NAMES.map(getMove)),
        Promise.all(OPP_MOVE_NAMES.map(getMove)),
      ]);
      if (cancelled) return;
      setOpponents(opps);
      setPlayerMoves(pm);
      setOppMoves(om);
    }
    init().catch(() => toast.error("Couldn't load opponents — refresh to retry."));
    return () => {
      cancelled = true;
    };
  }, []);

  if (roster.length < 3) {
    return (
      <main className="p-8">
        <p>You need at least 3 Pokémon in your roster.</p>
        <Button className="mt-3" onClick={() => router.push('/')}>
          Go pick some
        </Button>
      </main>
    );
  }
  if (!opponents.length) return <main className="p-8">Summoning opponents…</main>;

  async function onOver(result: {
    score: number;
    wins: number;
    battles: number;
    winner: 'player' | 'opponent';
  }) {
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Enter a name to save your score.');
      return;
    }
    setBusy(true);
    const { winner: _w, ...payload } = result;
    const res = await submitScore({ playerName: trimmed, ...payload });
    setBusy(false);
    if (res.ok) {
      toast.success('Score saved!');
      router.push('/leaderboard');
    } else {
      localStorage.setItem(
        'pokeattack:pending-score',
        JSON.stringify({ playerName: trimmed, ...payload }),
      );
      toast.error("Couldn't save your score — kept locally.");
    }
  }

  return (
    <main className="max-w-5xl mx-auto p-6">
      <header className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-semibold">Battle</h1>
        <Input
          placeholder="Your name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          maxLength={24}
          className="max-w-[200px]"
          disabled={busy}
        />
      </header>
      <BattleArena
        team={roster.slice(0, 3)}
        opponents={opponents}
        playerMoves={playerMoves}
        opponentMoves={oppMoves}
        onOver={onOver}
      />
    </main>
  );
}
