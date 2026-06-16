'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { spriteUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';
import {
  FEATURED_POKEMON as POKEMON,
  type FeaturedPokemon as Picked,
} from '@/lib/featured-pokemon';
import './AnimatedBackdrop.css';

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

export function AnimatedBackdrop() {
  const bounceRef = useRef<HTMLDivElement | null>(null);
  const isClient = useIsClient();

  const cardPicks = useMemo<Picked[]>(
    () =>
      isClient
        ? (shuffle(POKEMON).slice(0, 28) as Picked[])
        : (POKEMON.slice(0, 28) as unknown as Picked[]),
    [isClient],
  );

  useEffect(() => {
    const layer = bounceRef.current;
    if (!layer) return;

    // Respect prefers-reduced-motion
    if (
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      return;
    }

    const BALL_SIZE = 36;
    const colors = ['', 'b-cyan', 'b-gold', 'b-green', 'b-purple'];

    const balls = colors.map((c) => {
      const el = document.createElement('div');
      el.className = `bouncer ${c}`.trim();
      layer.appendChild(el);
      const rect = layer.getBoundingClientRect();
      const speed = 1.0 + Math.random() * 0.6;
      const a = Math.random() * Math.PI * 2;
      return {
        el,
        x: Math.random() * Math.max(0, rect.width - BALL_SIZE),
        y: Math.random() * Math.max(0, rect.height - BALL_SIZE),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
      };
    });

    let raf = 0;
    function tick() {
      const rect = layer!.getBoundingClientRect();
      for (const b of balls) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.x <= 0) {
          b.x = 0;
          b.vx = Math.abs(b.vx);
        }
        if (b.x + BALL_SIZE >= rect.width) {
          b.x = rect.width - BALL_SIZE;
          b.vx = -Math.abs(b.vx);
        }
        if (b.y <= 0) {
          b.y = 0;
          b.vy = Math.abs(b.vy);
        }
        if (b.y + BALL_SIZE >= rect.height) {
          b.y = rect.height - BALL_SIZE;
          b.vy = -Math.abs(b.vy);
        }
        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    return () => {
      cancelAnimationFrame(raf);
      for (const b of balls) b.el.remove();
    };
  }, []);

  return (
    <div className="animated-backdrop" aria-hidden="true">
      <div className="bg-cards">
        {cardPicks.map((p, i) => (
          <div key={p.id} className={`bg-card c${i + 1} type-${p.type}`}>
            <div className="num-bg">#{padId(p.id)}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spriteUrl(p.id)} alt="" loading="lazy" />
            <div className="name-bg">{p.name}</div>
          </div>
        ))}
      </div>
      <div className="bounce-layer" ref={bounceRef} />
    </div>
  );
}
