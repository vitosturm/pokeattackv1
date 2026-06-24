'use client';

import { useEffect, useState } from 'react';
import type { PokemonType } from '@/lib/type-chart';

interface Spark {
  id: number;
  x: number;
  y: number;
  color: string;
}

const COLOR: Partial<Record<PokemonType, string>> = {
  fire: '#ff6a3a',
  water: '#5ab2ff',
  electric: '#ffe14a',
  grass: '#7dd75a',
  ice: '#bff0f0',
  psychic: '#ff6aa0',
  dragon: '#7a4aff',
  ghost: '#9778d8',
  dark: '#5a4a3a',
  fairy: '#ffaad0',
  fighting: '#d33',
  steel: '#bcd',
  poison: '#a0a',
  ground: '#caa56a',
  rock: '#aa9355',
  bug: '#b0c026',
  flying: '#aac0ee',
  normal: '#ddd',
};

// Deterministic pseudo-random keyed on (trigger, index) — pure, so safe to call during render.
function pseudoRandom(seed: number): number {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

interface IntensityConfig {
  count: number;
  size: number;
  spread: number;
  opacity: number;
  grey: boolean;
}

const INTENSITY: Record<'miss' | 'weak' | 'normal' | 'strong', IntensityConfig> = {
  miss: { count: 6, size: 4, spread: 40, opacity: 0.5, grey: true },
  weak: { count: 10, size: 5, spread: 60, opacity: 0.7, grey: false },
  normal: { count: 18, size: 6, spread: 80, opacity: 0.9, grey: false },
  strong: { count: 28, size: 8, spread: 100, opacity: 1, grey: false },
};

export function TypeParticles({
  trigger,
  type,
  intensity = 'normal',
}: {
  trigger: number;
  type: PokemonType;
  intensity?: 'miss' | 'weak' | 'normal' | 'strong';
}) {
  const [hiddenTrigger, setHiddenTrigger] = useState<number | null>(null);
  useEffect(() => {
    if (trigger === 0) return;
    const t = setTimeout(() => setHiddenTrigger(trigger), 700);
    return () => clearTimeout(t);
  }, [trigger]);

  const cfg = INTENSITY[intensity];
  const color = cfg.grey ? '#999' : (COLOR[type] ?? '#fff');

  const sparks: Spark[] =
    trigger === 0 || hiddenTrigger === trigger
      ? []
      : Array.from({ length: cfg.count }, (_, i) => ({
          id: trigger * 100 + i,
          x: 50 + (pseudoRandom(trigger * 31 + i * 2) - 0.5) * cfg.spread,
          y: 50 + (pseudoRandom(trigger * 31 + i * 2 + 1) - 0.5) * cfg.spread,
          color,
        }));

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {sparks.map((s) => (
        <span
          key={s.id}
          data-testid="spark"
          className="absolute rounded-full"
          style={{
            left: `${s.x}%`,
            top: `${s.y}%`,
            width: cfg.size,
            height: cfg.size,
            background: s.color,
            opacity: cfg.opacity,
            boxShadow: `0 0 8px ${s.color}`,
          }}
        />
      ))}
    </div>
  );
}
