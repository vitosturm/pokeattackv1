'use client';

import Link from 'next/link';
import Tilt from 'react-parallax-tilt';
import { FEATURED_POKEMON } from '@/lib/featured-pokemon';
import { animatedSpriteUrl, cryUrl, spriteUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';
import { useRoster, MAX_ROSTER } from '@/hooks/useRoster';
import { useSound } from '@/hooks/useSound';
import { TypeBadge } from '@/components/TypeBadge';
import type { PokemonType } from '@/lib/type-chart';
import type { PokemonSummary } from '@/lib/types';

export function HomePokedexPreview() {
  const { roster, add } = useRoster();
  const playCry = useSound();

  const inRoster = (id: number) => roster.some((p) => p.id === id);

  function handleQuickAdd(p: { id: number; name: string; type: string }) {
    if (inRoster(p.id) || roster.length >= MAX_ROSTER) return;
    // Build a minimal PokemonSummary from the featured list. The featured list
    // doesn't carry real stats — we use placeholder stats here (50 across) so
    // the user can "preview" the add. The full stats arrive when they later
    // visit /pokemon/[id]. For battle, the roster is re-fetched via
    // getPokemonWithMoves which gets the real stats.
    const summary: PokemonSummary = {
      id: p.id,
      name: p.name,
      types: [p.type as PokemonType],
      stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 },
      sprite: spriteUrl(p.id),
    };
    add(summary);
    playCry(cryUrl(p.id));
  }

  return (
    <section className="pt-4 pb-20 px-6 max-w-6xl mx-auto">
      <header className="flex items-end justify-between mb-8">
        <div>
          <h2
            className="text-4xl mb-2"
            style={{
              fontFamily: 'Bangers, Impact, sans-serif',
              letterSpacing: '0.04em',
              textShadow: '2px 2px 0 #1a1a1a, 3px 3px 0 rgba(255,56,96,0.55)',
            }}
          >
            Choose your starters
          </h2>
          <p className="text-white/60 text-sm">
            Pick up to 6 Pokémon to claim as yours, then bring 3 into battle. ({roster.length}/
            {MAX_ROSTER} picked)
          </p>
        </div>
        <Link
          href="/pokedex"
          className="text-[10px] uppercase font-bold text-[#ff3860] hover:underline"
          style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
        >
          View all 151 →
        </Link>
      </header>

      <div className="flex gap-4 overflow-x-auto pb-6 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-white/10">
        {FEATURED_POKEMON.map((p) => {
          const inR = inRoster(p.id);
          return (
            <Tilt
              key={p.id}
              tiltMaxAngleX={10}
              tiltMaxAngleY={10}
              glareEnable
              glareMaxOpacity={0.2}
              glareColor="#ffffff"
              glarePosition="all"
              className="shrink-0 snap-start"
            >
              <div className="w-44 bg-[#14141f] border border-white/10 rounded-xl p-3 flex flex-col items-center gap-2">
                <span className="text-[10px] text-white/50 self-start font-mono">
                  #{padId(p.id)}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={animatedSpriteUrl(p.id)}
                  alt={p.name}
                  className="w-28 h-28 object-contain"
                  style={{ imageRendering: 'pixelated' }}
                  onError={(e) => {
                    (e.currentTarget as HTMLImageElement).src = spriteUrl(p.id);
                  }}
                />
                <span className="capitalize font-semibold text-sm">{p.name}</span>
                <TypeBadge type={p.type as PokemonType} />
                <button
                  onClick={() => handleQuickAdd(p)}
                  disabled={inR || roster.length >= MAX_ROSTER}
                  className={`w-full mt-2 py-1.5 rounded-md text-[10px] uppercase font-bold transition ${
                    inR
                      ? 'bg-white/5 text-white/30 cursor-default'
                      : roster.length >= MAX_ROSTER
                        ? 'bg-white/5 text-white/30 cursor-not-allowed'
                        : 'bg-[#ff3860] hover:opacity-90 text-white'
                  }`}
                  style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.08em' }}
                >
                  {inR ? 'Picked' : 'Add'}
                </button>
              </div>
            </Tilt>
          );
        })}
      </div>
    </section>
  );
}
