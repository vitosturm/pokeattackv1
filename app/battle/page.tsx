'use client';

import { useMemo, useState } from 'react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import { useRoster } from '@/hooks/useRoster';
import { useSound } from '@/hooks/useSound';
import { cryUrl, getPokemonWithMoves, randomGen1Ids } from '@/lib/pokeapi';
import type { Move, PokemonSummary } from '@/lib/types';
import { BattleArena } from '@/components/BattleArena';
import { GameboyFrame } from '@/components/GameboyFrame';
import { HoloCard } from '@/components/HoloCard';
import { TCG_CARD_IMAGE } from '@/lib/tcg-cards';
import { submitScore } from '@/app/actions/leaderboard';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SiteNav } from '@/components/SiteNav';
import { SectionTransition } from '@/components/SectionTransition';
import Link from 'next/link';
import '@/components/glass-card.css';

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
  const [saved, setSaved] = useState(false);
  const [lastResult, setLastResult] = useState<{
    score: number;
    wins: number;
    battles: number;
    winner: 'player' | 'opponent';
  } | null>(null);
  const [wave, setWave] = useState(1);

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
        <div className="relative px-14 md:px-20 pt-14 pb-12 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />
          <h1
            className="relative text-6xl md:text-8xl leading-none"
            style={{
              fontFamily: 'Bangers, Impact, sans-serif',
              letterSpacing: '0.04em',
              textShadow: '2px 2px 0 #1a1a1a, 4px 4px 0 rgba(255,56,96,0.5)',
            }}
          >
            BATTLE
          </h1>
        </div>
        <main className="px-14 md:px-20 pb-24">
          <SectionTransition>
            <div className="glass-panel rounded-xl py-20 text-center max-w-lg mx-auto">
              <p className="text-5xl mb-4" style={{ fontFamily: 'Bangers, Impact, sans-serif' }}>
                Not enough Pokémon!
              </p>
              <p className="text-white/60 mb-8 text-sm">
                You need at least 3 Pokémon in your roster to start a battle.
              </p>
              <Link
                href="/pokedex"
                className="inline-block bg-[#ff3860] hover:opacity-90 transition-opacity px-8 py-3 rounded-full font-bold"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '9px',
                  letterSpacing: '0.1em',
                }}
              >
                Go to Pokédex →
              </Link>
            </div>
          </SectionTransition>
        </main>
      </>
    );
  }

  function togglePick(id: number) {
    setPickedTouched(true);
    setPicked((prev) => {
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

  async function loadNextWave(): Promise<{
    opponents: PokemonSummary[];
    opponentMoves: Record<number, Move[]>;
  }> {
    try {
      const ids = randomGen1Ids(3);
      const oppLoaded = await Promise.all(ids.map((id) => getPokemonWithMoves(id)));
      const opponentMoves: Record<number, Move[]> = {};
      for (const { pokemon, moves } of oppLoaded) opponentMoves[pokemon.id] = moves;
      return { opponents: oppLoaded.map((t) => t.pokemon), opponentMoves };
    } catch {
      toast.error("Couldn't load the next wave. Try refreshing.");
      throw new Error('wave-load-failed');
    }
  }

  async function saveScore(result: {
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
    void _w;
    const res = await submitScore({ playerName: trimmed, ...payload });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      toast.success('Score saved!');
    } else {
      localStorage.setItem(
        'pokeattack:pending-score',
        JSON.stringify({ playerName: trimmed, ...payload }),
      );
      toast.error("Couldn't save your score — kept locally.");
    }
  }

  async function onOver(result: {
    score: number;
    wins: number;
    battles: number;
    winner: 'player' | 'opponent';
  }) {
    setLastResult(result);
    setSaved(false);
    setPhase('over');
    if (name.trim()) {
      await saveScore(result);
    }
  }

  function rematch() {
    setPicked(new Set());
    setPickedTouched(false);
    setBundle(null);
    setLastResult(null);
    setSaved(false);
    setWave(1);
    setPhase('pick');
  }

  return (
    <>
      <SiteNav />

      {/* Hero — dynamic title per phase */}
      <div className="relative px-14 md:px-20 pt-14 pb-10 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/10 to-transparent pointer-events-none" />
        <div className="relative flex items-end justify-between gap-6 flex-wrap">
          <div>
            <h1
              className="text-6xl md:text-8xl leading-none"
              style={{
                fontFamily: 'Bangers, Impact, sans-serif',
                letterSpacing: '0.04em',
                textShadow: '2px 2px 0 #1a1a1a, 4px 4px 0 rgba(255,56,96,0.5)',
              }}
            >
              {phase === 'over'
                ? lastResult?.winner === 'player'
                  ? 'VICTORY!'
                  : 'DEFEATED'
                : 'BATTLE'}
            </h1>
            <p className="mt-3 text-sm text-white/60">
              {phase === 'pick' && `Choose 3 from your roster — ${effectivePicked.size}/3 selected`}
              {phase === 'loading' && 'Summoning opponents…'}
              {phase === 'fight' && `Wave ${wave} — fight to the finish!`}
              {phase === 'over' &&
                lastResult &&
                `Score: ${lastResult.score} · Wins: ${lastResult.wins} · Battles: ${lastResult.battles}`}
            </p>
          </div>
          {/* Name input — visible during pick & fight */}
          {(phase === 'pick' || phase === 'fight') && (
            <div className="flex-shrink-0">
              <Input
                placeholder="Your name (for leaderboard)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                maxLength={24}
                className="w-[260px] bg-white/5 border-white/20"
                disabled={busy}
              />
            </div>
          )}
        </div>
      </div>

      <main className="px-14 md:px-20 pb-24">
        {/* ── Pick phase ── */}
        {phase === 'pick' && (
          <SectionTransition>
            <div className="grid gap-6 grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-6 mb-10">
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
                    className={`relative cursor-pointer transition-all ${
                      on
                        ? 'ring-2 ring-[#ff3860] ring-offset-2 ring-offset-transparent rounded-xl scale-[1.02]'
                        : 'opacity-70 hover:opacity-100'
                    }`}
                  >
                    <HoloCard pokemon={p} imageSrc={p.sprite} tcgImageUrl={TCG_CARD_IMAGE[p.id]} />
                    {on && (
                      <span
                        className="absolute top-2 left-2 bg-[#ff3860] text-white text-[10px] px-2 py-0.5 rounded-full z-10"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        ✓
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end">
              <Button
                onClick={startBattle}
                disabled={effectivePicked.size !== 3}
                className="bg-[#ff3860] hover:bg-[#e02850] text-white px-10 py-3 rounded-full"
                style={{
                  fontFamily: '"Press Start 2P", monospace',
                  fontSize: '9px',
                  letterSpacing: '0.12em',
                }}
              >
                Start battle →
              </Button>
            </div>
          </SectionTransition>
        )}

        {/* ── Loading phase ── */}
        {phase === 'loading' && (
          <div className="flex flex-col items-center justify-center py-32 gap-6">
            <div
              className="text-5xl animate-bounce"
              style={{ fontFamily: 'Bangers, Impact, sans-serif', color: '#ff3860' }}
            >
              ⚔
            </div>
            <p
              className="text-white/60 text-sm"
              style={{ fontFamily: '"Press Start 2P", monospace' }}
            >
              Summoning opponents…
            </p>
          </div>
        )}

        {/* ── Fight phase ── */}
        {phase === 'fight' && bundle && (
          <GameboyFrame>
            <BattleArena
              team={bundle.team}
              opponents={bundle.opponents}
              playerMoves={bundle.playerMoves}
              opponentMoves={bundle.oppMoves}
              onOver={onOver}
              onWaveClear={loadNextWave}
              onWaveChange={setWave}
            />
          </GameboyFrame>
        )}

        {/* ── Over phase ── */}
        {phase === 'over' && lastResult && (
          <SectionTransition>
            <div className="flex flex-col items-center gap-8 max-w-lg mx-auto">
              {/* Stats card */}
              <div className="glass-panel rounded-xl p-8 w-full text-center">
                <div className="grid grid-cols-3 gap-4">
                  {[
                    { label: 'Score', value: lastResult.score, big: true },
                    { label: 'Wins', value: lastResult.wins, big: false },
                    { label: 'Battles', value: lastResult.battles, big: false },
                  ].map(({ label, value, big }) => (
                    <div key={label}>
                      <div
                        className={big ? 'text-5xl text-[#ff3860]' : 'text-3xl text-white'}
                        style={{ fontFamily: 'Bangers, Impact, sans-serif' }}
                      >
                        {value}
                      </div>
                      <div
                        className="text-[10px] text-white/50 uppercase tracking-widest mt-1"
                        style={{ fontFamily: '"Press Start 2P", monospace' }}
                      >
                        {label}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Save score */}
              {!saved ? (
                <div className="glass-panel rounded-xl p-6 w-full">
                  <p className="text-sm text-white/60 mb-4 text-center">
                    Enter a name to save your score to the leaderboard.
                  </p>
                  <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                      e.preventDefault();
                      void saveScore(lastResult);
                    }}
                  >
                    <Input
                      placeholder="Your trainer name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      maxLength={24}
                      disabled={busy}
                      autoFocus
                      className="bg-white/5 border-white/20"
                    />
                    <Button
                      type="submit"
                      disabled={busy || !name.trim()}
                      className="bg-[#ff3860] hover:bg-[#e02850] text-white shrink-0"
                    >
                      {busy ? 'Saving…' : 'Save'}
                    </Button>
                  </form>
                </div>
              ) : (
                <p className="text-green-400 text-sm text-center">
                  ✓ Score saved to the leaderboard.
                </p>
              )}

              {/* Action buttons */}
              <div className="flex gap-3">
                <Button
                  onClick={rematch}
                  className="bg-[#ff3860] hover:bg-[#e02850] text-white px-8"
                >
                  Rematch
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/leaderboard')}
                  className="border border-white/20 hover:bg-white/10"
                >
                  Leaderboard
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => router.push('/')}
                  className="border border-white/20 hover:bg-white/10"
                >
                  Home
                </Button>
              </div>
            </div>
          </SectionTransition>
        )}
      </main>
    </>
  );
}
