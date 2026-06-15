'use client';

import { useEffect, useState } from 'react';
import type { PokemonType } from '@/lib/type-chart';

interface Spark { id: number; x: number; y: number; color: string }

const COLOR: Partial<Record<PokemonType, string>> = {
  fire: '#ff6a3a', water: '#5ab2ff', electric: '#ffe14a', grass: '#7dd75a',
  ice: '#bff0f0', psychic: '#ff6aa0', dragon: '#7a4aff', ghost: '#9778d8',
  dark: '#5a4a3a', fairy: '#ffaad0', fighting: '#d33', steel: '#bcd', poison: '#a0a',
  ground: '#caa56a', rock: '#aa9355', bug: '#b0c026', flying: '#aac0ee', normal: '#ddd',
};

export function TypeParticles({ trigger, type }: { trigger: number; type: PokemonType }) {
  const [sparks, setSparks] = useState<Spark[]>([]);
  useEffect(() => {
    if (trigger === 0) return;
    const next: Spark[] = Array.from({ length: 18 }, (_, i) => ({
      id: trigger * 100 + i,
      x: 50 + (Math.random() - 0.5) * 80,
      y: 50 + (Math.random() - 0.5) * 80,
      color: COLOR[type] ?? '#fff',
    }));
    setSparks(next);
    const t = setTimeout(() => setSparks([]), 700);
    return () => clearTimeout(t);
  }, [trigger, type]);
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map((s) => (
        <span
          key={s.id}
          className="absolute h-1.5 w-1.5 rounded-full opacity-90"
          style={{ left: `${s.x}%`, top: `${s.y}%`, background: s.color, boxShadow: `0 0 8px ${s.color}` }}
        />
      ))}
    </div>
  );
}
