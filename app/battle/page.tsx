'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRoster } from '@/hooks/useRoster';
import { useSound } from '@/hooks/useSound';
import { cryUrl, getPokemonWithMoves, randomGen1Ids } from '@/lib/pokeapi';
import type { Move, PokemonSummary } from '@/lib/types';
import { BattleArena } from '@/components/BattleArena';
import { PokemonCard } from '@/components/PokemonCard';
import { submitScore } from '@/app/actions/leaderboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SiteNav } from '@/components/SiteNav';

type Phase = 'pick' | 'loading' | 'fight' | 'over';

interface LoadedBundle {
  team: PokemonSummary[];
  opponents: PokemonSummary[];
  playerMoves: Record<number, Move[]>;
  oppMoves: Record<number, Move[]>;
}

export default function BattlePage() {
  const router = useRouter();
  const { roster } = useRoster();
  const playCry = useSound();
  const [phase, setPhase] = useState<Phase>('pick');
  const [picked, setPicked] = useState<Set<number>>(new Set());
  const [pickedTouched, setPickedTouched] = useState(false);
  const [bundle, setBundle] = useState<LoadedBundle | null>(null);
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);
  const [lastResult, setLastResult] = useState<{
    score: number;
    wins: number;
    battles: number;
    winner: 'player' | 'opponent';
  } | null>(null);

  // When roster has exactly 3 and user hasn't touched the picker, pre-select all 3.
  const effectivePicked = useMemo(() => {
    if (!pickedTouched && roster.length === 3) {
      return new Set(roster.map((p) => p.id));
    }
    return picked;
  }, [pickedTouched, picked, roster]);

  if (roster.length < 3) {
    return (
      <>
        <SiteNav />
        <main className="p-8 max-w-2xl mx-auto">
          <p>You need at least 3 Pokémon in your roster.</p>
          <Button className="mt-3" onClick={() => router.push('/pokedex')}>
            Go pick some
          </Button>
        </main>
      </>
    );
  }

  function togglePick(id: number) {
    setPickedTouched(true);
    setPicked((prev) => {
      // Seed from the effective set on first touch
      const seed = !pickedTouched ? effectivePicked : prev;
      const next = new Set(seed);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < 3) {
        next.add(id);
        playCry(cryUrl(id));
      }
      return next;
    });
  }

  async function startBattle() {
    if (effectivePicked.size !== 3) return;
    const team = roster.filter((p) => effectivePicked.has(p.id));
    setPhase('loading');
    try {
      const ids = randomGen1Ids(3);
      const [teamLoaded, oppLoaded] = await Promise.all([
        Promise.all(team.map((p) => getPokemonWithMoves(p.id))),
        Promise.all(ids.map((id) => getPokemonWithMoves(id))),
      ]);
      const playerMoves: Record<number, Move[]> = {};
      const oppMoves: Record<number, Move[]> = {};
      for (const { pokemon, moves } of teamLoaded) playerMoves[pokemon.id] = moves;
      for (const { pokemon, moves } of oppLoaded) oppMoves[pokemon.id] = moves;
      setBundle({
        team: teamLoaded.map((t) => t.pokemon),
        opponents: oppLoaded.map((t) => t.pokemon),
        playerMoves,
        oppMoves,
      });
      setPhase('fight');
    } catch {
      toast.error("Couldn't load battle data. Try again.");
      setPhase('pick');
    }
  }

  async function onOver(result: {
    score: number;
    wins: number;
    battles: number;
    winner: 'player' | 'opponent';
  }) {
    setLastResult(result);
    setPhase('over');
    const trimmed = name.trim();
    if (!trimmed) {
      toast('Enter a name above to save your score.');
      return;
    }
    setBusy(true);
    const { winner: _w, ...payload } = result;
    void _w;
    const res = await submitScore({ playerName: trimmed, ...payload });
    setBusy(false);
    if (res.ok) {
      toast.success('Score saved!');
    } else {
      localStorage.setItem(
        'pokeattack:pending-score',
        JSON.stringify({ playerName: trimmed, ...payload }),
      );
      toast.error("Couldn't save your score — kept locally.");
    }
  }

  function rematch() {
    setPicked(new Set());
    setPickedTouched(false);
    setBundle(null);
    setLastResult(null);
    setPhase('pick');
  }

  return (
    <>
      <SiteNav />
      <main className="max-w-5xl mx-auto p-6">
        <header className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-semibold">Battle</h1>
          <Input
            placeholder="Your name (for leaderboard)"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={24}
            className="max-w-[260px]"
            disabled={busy}
          />
        </header>

        {phase === 'pick' && (
          <section>
            <p className="mb-4 text-white/70">
              Choose 3 starters from your roster ({effectivePicked.size}/3 selected):
            </p>
            <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
              {roster.map((p) => {
                const on = effectivePicked.has(p.id);
                return (
                  <div
                    key={p.id}
                    onClick={() => togglePick(p.id)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') togglePick(p.id);
                    }}
                    className={`relative cursor-pointer transition ${
                      on ? 'ring-2 ring-[#ff3860] rounded-lg' : 'opacity-80 hover:opacity-100'
                    }`}
                  >
                    <PokemonCard pokemon={p} />
                    {on && (
                      <span className="absolute top-2 right-2 bg-[#ff3860] text-white text-xs px-2 py-0.5 rounded-full">
                        Picked
                      </span>
                    )}
                  </div>
                );
              })}
            </div>
            <div className="mt-6 flex justify-end">
              <Button onClick={startBattle} disabled={effectivePicked.size !== 3}>
                Start battle →
              </Button>
            </div>
          </section>
        )}

        {phase === 'loading' && (
          <p className="text-center text-white/70 py-12">Summoning opponents…</p>
        )}

        {phase === 'fight' && bundle && (
          <BattleArena
            team={bundle.team}
            opponents={bundle.opponents}
            playerMoves={bundle.playerMoves}
            opponentMoves={bundle.oppMoves}
            onOver={onOver}
          />
        )}

        {phase === 'over' && lastResult && (
          <section className="grid gap-6 md:grid-cols-2">
            <div className="text-center md:col-span-2 p-4">
              <p className="text-3xl font-bold">
                {lastResult.winner === 'player' ? 'Victory!' : 'Defeated.'}
              </p>
              <p className="text-sm text-white/60 mt-2">
                Score: {lastResult.score} · Wins: {lastResult.wins} · Battles: {lastResult.battles}
              </p>
            </div>
            <div className="md:col-span-2 flex justify-center gap-3">
              <Button onClick={rematch}>Rematch</Button>
              <Button variant="ghost" onClick={() => router.push('/leaderboard')}>
                Leaderboard
              </Button>
              <Button variant="ghost" onClick={() => router.push('/')}>
                Home
              </Button>
            </div>
          </section>
        )}
      </main>
    </>
  );
}
