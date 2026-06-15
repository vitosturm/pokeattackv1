'use client';

import { Radar, RadarChart, PolarGrid, PolarAngleAxis, ResponsiveContainer } from 'recharts';
import type { PokemonSummary } from '@/lib/types';

export function StatRadar({ pokemon }: { pokemon: PokemonSummary }) {
  const data = [
    { stat: 'HP', value: pokemon.stats.hp },
    { stat: 'ATK', value: pokemon.stats.attack },
    { stat: 'DEF', value: pokemon.stats.defense },
    { stat: 'SPA', value: pokemon.stats.specialAttack },
    { stat: 'SPD', value: pokemon.stats.specialDefense },
    { stat: 'SPE', value: pokemon.stats.speed },
  ];
  return (
    <ResponsiveContainer width="100%" height={260}>
      <RadarChart data={data}>
        <PolarGrid stroke="rgba(255,255,255,0.15)" />
        <PolarAngleAxis dataKey="stat" tick={{ fill: '#cfcfdc', fontSize: 11 }} />
        <Radar name="stats" dataKey="value" stroke="#ff3860" fill="#ff3860" fillOpacity={0.45} />
      </RadarChart>
    </ResponsiveContainer>
  );
}
