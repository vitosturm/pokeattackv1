'use client';

import CountUp from '@/components/ui/count-up';
import type { PokemonSummary } from '@/lib/types';

const ROWS: { label: string; key: keyof PokemonSummary['stats'] }[] = [
  { label: 'HP', key: 'hp' },
  { label: 'Attack', key: 'attack' },
  { label: 'Defense', key: 'defense' },
  { label: 'Sp. Atk', key: 'specialAttack' },
  { label: 'Sp. Def', key: 'specialDefense' },
  { label: 'Speed', key: 'speed' },
];

export function StatGrid({ pokemon }: { pokemon: PokemonSummary }) {
  return (
    <dl className="grid grid-cols-3 gap-3 mt-4">
      {ROWS.map(({ label, key }, i) => (
        <div
          key={key}
          className="glass-card rounded-lg px-3 py-2 flex flex-col items-center gap-0.5"
        >
          <dt className="text-[10px] uppercase tracking-wide text-white/60">{label}</dt>
          <dd className="text-xl font-bold tabular-nums">
            <CountUp to={pokemon.stats[key]} duration={1.2} delay={i * 0.08} />
          </dd>
        </div>
      ))}
    </dl>
  );
}
