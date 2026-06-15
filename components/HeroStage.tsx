'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { animatedSpriteUrl, spriteUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';
import './HeroStage.css';

const subscribeNoop = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

const POKEMON = [
  { id: 1, name: 'bulbasaur', type: 'grass' },
  { id: 4, name: 'charmander', type: 'fire' },
  { id: 7, name: 'squirtle', type: 'water' },
  { id: 25, name: 'pikachu', type: 'electric' },
  { id: 6, name: 'charizard', type: 'fire' },
  { id: 9, name: 'blastoise', type: 'water' },
  { id: 3, name: 'venusaur', type: 'grass' },
  { id: 39, name: 'jigglypuff', type: 'fairy' },
  { id: 54, name: 'psyduck', type: 'water' },
  { id: 63, name: 'abra', type: 'psychic' },
  { id: 74, name: 'geodude', type: 'rock' },
  { id: 92, name: 'gastly', type: 'ghost' },
  { id: 94, name: 'gengar', type: 'ghost' },
  { id: 113, name: 'chansey', type: 'normal' },
  { id: 131, name: 'lapras', type: 'ice' },
  { id: 133, name: 'eevee', type: 'normal' },
  { id: 143, name: 'snorlax', type: 'normal' },
  { id: 149, name: 'dragonite', type: 'dragon' },
  { id: 150, name: 'mewtwo', type: 'psychic' },
  { id: 151, name: 'mew', type: 'psychic' },
  { id: 130, name: 'gyarados', type: 'water' },
  { id: 59, name: 'arcanine', type: 'fire' },
  { id: 65, name: 'alakazam', type: 'psychic' },
  { id: 68, name: 'machamp', type: 'fighting' },
  { id: 38, name: 'ninetales', type: 'fire' },
  { id: 103, name: 'exeggutor', type: 'grass' },
  { id: 115, name: 'kangaskhan', type: 'normal' },
  { id: 144, name: 'articuno', type: 'ice' },
  { id: 145, name: 'zapdos', type: 'electric' },
  { id: 146, name: 'moltres', type: 'fire' },
] as const;

type Picked = (typeof POKEMON)[number];

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function HeroStage() {
  const router = useRouter();
  const bounceRef = useRef<HTMLDivElement | null>(null);
  const centerRef = useRef<HTMLDivElement | null>(null);

  const isClient = useIsClient();
  const cardPicks = useMemo<Picked[]>(
    () =>
      isClient
        ? (shuffle(POKEMON).slice(0, 28) as Picked[])
        : (POKEMON.slice(0, 28) as unknown as Picked[]),
    [isClient],
  );
  const tickerPicks = useMemo<Picked[]>(
    () =>
      isClient
        ? (shuffle(POKEMON).slice(0, 10) as Picked[])
        : (POKEMON.slice(0, 10) as unknown as Picked[]),
    [isClient],
  );

  useEffect(() => {
    const layer = bounceRef.current;
    const center = centerRef.current;
    if (!layer || !center) return;

    const BALL_SIZE = 36;
    const colors = ['', 'b-cyan', 'b-gold', 'b-green', 'b-purple'];

    const balls = colors.map((c) => {
      const el = document.createElement('div');
      el.className = `bouncer ${c}`.trim();
      layer.appendChild(el);
      const rect = layer.getBoundingClientRect();
      const speed = 1.3 + Math.random() * 0.9;
      const a = Math.random() * Math.PI * 2;
      return {
        el,
        x: Math.random() * (rect.width - BALL_SIZE),
        y: Math.random() * (rect.height - BALL_SIZE),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        cooldown: 0,
      };
    });

    let raf = 0;
    function bumpCenter() {
      center!.classList.remove('hit');
      void center!.offsetWidth;
      center!.classList.add('hit');
    }
    function tick() {
      const rect = layer!.getBoundingClientRect();
      const cRect = center!.getBoundingClientRect();
      const cx = cRect.left - rect.left + cRect.width / 2;
      const cy = cRect.top - rect.top + cRect.height / 2;
      const cR = cRect.width / 2;
      const smallR = BALL_SIZE / 2;

      for (const b of balls) {
        b.x += b.vx;
        b.y += b.vy;
        if (b.cooldown > 0) b.cooldown--;

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

        const bx = b.x + smallR,
          by = b.y + smallR;
        const dx = bx - cx,
          dy = by - cy;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const minDist = cR + smallR;
        if (dist > 0 && dist < minDist) {
          const nx = dx / dist,
            ny = dy / dist;
          const overlap = minDist - dist;
          b.x += nx * overlap;
          b.y += ny * overlap;
          const dot = b.vx * nx + b.vy * ny;
          if (dot < 0) {
            b.vx -= 2 * dot * nx;
            b.vy -= 2 * dot * ny;
            bumpCenter();
          }
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
    <div className="hero-stage relative h-[820px] overflow-hidden">
      {/* Background cards */}
      <div className="bg-cards absolute inset-0 pointer-events-none z-[2]">
        {cardPicks.map((p, i) => (
          <div key={p.id} className={`bg-card c${i + 1} type-${p.type}`}>
            <div className="num-bg">#{padId(p.id)}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spriteUrl(p.id)} alt={p.name} loading="lazy" />
            <div className="name-bg">{p.name}</div>
          </div>
        ))}
      </div>

      {/* Nav */}
      <div className="nav-bar">
        <div className="logo">POKEATTACK</div>
        <div className="nav-items">
          <span>Home</span>
          <span>Roster</span>
          <span>Battle</span>
          <span>Leaderboard</span>
          <span
            className="cta-nav"
            role="button"
            tabIndex={0}
            onClick={() => router.push('/battle')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') router.push('/battle');
            }}
          >
            Play now
          </span>
        </div>
      </div>

      {/* Stage */}
      <div className="stage">
        <div className="stage-left">
          <span className="gb-led" />
          <div className="gb-screen">
            <div className="panel-head">
              <span className="dot-status" />
              <span>Mission · Vol.01 — 2026</span>
            </div>
            <h2>
              Train.
              <br />
              Battle.
              <br />
              <em>Conquer.</em>
            </h2>
            <p>Build a team of three. Master 18 types. Climb the board.</p>
            <div className="cta-row">
              <button className="btn primary" onClick={() => router.push('/battle')}>
                Start →
              </button>
              <button className="btn ghost" onClick={() => router.push('/pokemon/1')}>
                Pokédex
              </button>
            </div>
          </div>
        </div>

        <div className="center-stage">
          <div
            className="pokeball-wrap"
            role="button"
            tabIndex={0}
            onClick={() => router.push('/battle')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') router.push('/battle');
            }}
            aria-label="Play now — go to battle"
          >
            <div className="ring-glow" />
            <div className="pokeball-main" ref={centerRef}>
              <div className="ball" />
              <div className="highlight" />
            </div>
            <div className="pokeball-cta">Play now — Battle</div>
          </div>
        </div>

        <div className="stage-right">
          <span className="gb-led" />
          <div className="gb-screen">
            <div className="panel-head">
              <span>Leaderboard · Live ranking</span>
              <span className="dot-status red" />
            </div>
            <h2>
              151
              <br />
              Pokémon.
              <br />
              <em>Endless</em>
              <br />
              battles.
            </h2>
            <div className="stat-grid">
              <div className="stat">
                <div className="stat-num">18</div>
                <div className="stat-lbl">Types</div>
              </div>
              <div className="stat">
                <div className="stat-num">3v3</div>
                <div className="stat-lbl">Battles</div>
              </div>
              <div className="stat">
                <div className="stat-num">∞</div>
                <div className="stat-lbl">Replays</div>
              </div>
            </div>
            <div className="live-row">
              <span>Live now</span>
              <span className="pulse-dot" />
            </div>
          </div>
        </div>
      </div>

      <div className="bounce-layer" ref={bounceRef} />

      <div className="ticker">
        <div className="ticker-track">
          {[...tickerPicks, ...tickerPicks].map((p, i) => (
            <span key={`${p.id}-${i}`} className="ticker-item">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img className="avatar" src={animatedSpriteUrl(p.id)} alt={p.name} loading="lazy" />
              <span>{p.name}</span>
              <span className="num">#{padId(p.id)}</span>
              <span className="sep">✦</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
