'use client';

import { useState } from 'react';
import { TYPES, typeMultiplier, type PokemonType } from '@/lib/type-chart';
import { TypeBadge } from '@/components/TypeBadge';

export function HomeTypeDemo() {
  const [attacker, setAttacker] = useState<PokemonType>('fire');

  const buckets = {
    superEffective: [] as PokemonType[],
    notVeryEffective: [] as PokemonType[],
    immune: [] as PokemonType[],
    neutral: [] as PokemonType[],
  };

  for (const defender of TYPES) {
    const m = typeMultiplier(attacker, [defender]);
    if (m === 2) buckets.superEffective.push(defender);
    else if (m === 0.5) buckets.notVeryEffective.push(defender);
    else if (m === 0) buckets.immune.push(defender);
    else buckets.neutral.push(defender);
  }

  return (
    <section className="py-20 px-6 bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
      <div className="max-w-6xl mx-auto">
        <header className="mb-10">
          <h2
            className="text-4xl mb-2"
            style={{
              fontFamily: 'Bangers, Impact, sans-serif',
              letterSpacing: '0.04em',
              textShadow: '2px 2px 0 #1a1a1a, 3px 3px 0 rgba(255,56,96,0.55)',
            }}
          >
            Type effectiveness
          </h2>
          <p className="text-white/60 text-sm max-w-2xl">
            Pick a type to see what it hits hard and what shrugs it off. Mastering this is how
            battles are won.
          </p>
        </header>

        <div className="grid gap-8 md:grid-cols-[1fr_2fr]">
          <div>
            <p
              className="text-[10px] uppercase text-white/60 mb-3"
              style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
            >
              Pick attacker
            </p>
            <div className="flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  onClick={() => setAttacker(t)}
                  className={`transition ${attacker === t ? 'scale-110' : 'opacity-60 hover:opacity-100'}`}
                >
                  <TypeBadge type={t} />
                </button>
              ))}
            </div>
          </div>

          <div className="grid gap-4">
            <Bucket
              label="Super-effective (2×)"
              types={buckets.superEffective}
              accent="text-green-400"
            />
            <Bucket
              label="Not very effective (0.5×)"
              types={buckets.notVeryEffective}
              accent="text-yellow-300"
            />
            <Bucket label="No effect (0×)" types={buckets.immune} accent="text-red-400" />
          </div>
        </div>
      </div>
    </section>
  );
}

function Bucket({ label, types, accent }: { label: string; types: PokemonType[]; accent: string }) {
  return (
    <div className="bg-[#14141f] border border-white/10 rounded-lg p-4">
      <p
        className={`text-[10px] uppercase mb-3 ${accent}`}
        style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
      >
        {label}
      </p>
      {types.length === 0 ? (
        <p className="text-white/30 text-sm">—</p>
      ) : (
        <div className="flex flex-wrap gap-2">
          {types.map((t) => (
            <TypeBadge key={t} type={t} />
          ))}
        </div>
      )}
    </div>
  );
}
