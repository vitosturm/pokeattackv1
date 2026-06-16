'use client';

import { useMemo, useSyncExternalStore } from 'react';
import { animatedSpriteUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';
import { FEATURED_POKEMON } from '@/lib/featured-pokemon';
import './TickerBar.css';

const subscribeNoop = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function TickerBar() {
  const isClient = useIsClient();
  const picks = useMemo(
    () => (isClient ? shuffle(FEATURED_POKEMON).slice(0, 10) : FEATURED_POKEMON.slice(0, 10)),
    [isClient],
  );

  return (
    <div className="ticker-bar" aria-hidden="true">
      <div className="ticker-track">
        {[...picks, ...picks].map((p, i) => (
          <span key={`${p.id}-${i}`} className="ticker-item">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img className="avatar" src={animatedSpriteUrl(p.id)} alt="" loading="lazy" />
            <span>{p.name}</span>
            <span className="num">#{padId(p.id)}</span>
            <span className="sep">✦</span>
          </span>
        ))}
      </div>
    </div>
  );
}
