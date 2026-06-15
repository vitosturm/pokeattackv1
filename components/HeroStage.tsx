'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { useRouter } from 'next/navigation';
import { animatedSpriteUrl, spriteUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';

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

      <style jsx>{`
        .hero-stage {
          --accent: #ff3860;
          --text: #e8e8ee;
          --muted: #8a8a99;
          --border: rgba(255, 255, 255, 0.08);
          font-family:
            'Inter',
            -apple-system,
            BlinkMacSystemFont,
            sans-serif;
          color: var(--text);
          -webkit-font-smoothing: antialiased;
          cursor: none;
          background:
            radial-gradient(ellipse at 20% 30%, #2d0a4d 0%, transparent 50%),
            radial-gradient(ellipse at 80% 70%, #4d0a2d 0%, transparent 50%),
            radial-gradient(ellipse at 50% 50%, #1a0a3a 0%, #050510 80%);
        }
        .hero-stage * {
          box-sizing: border-box;
          margin: 0;
          padding: 0;
        }
        .hero-stage::before {
          content: '';
          position: absolute;
          inset: 0;
          background:
            radial-gradient(circle at 12% 25%, rgba(255, 0, 128, 0.3), transparent 35%),
            radial-gradient(circle at 88% 30%, rgba(0, 240, 255, 0.25), transparent 35%),
            radial-gradient(circle at 75% 80%, rgba(255, 215, 0, 0.22), transparent 35%),
            radial-gradient(circle at 25% 75%, rgba(123, 192, 79, 0.22), transparent 35%),
            radial-gradient(circle at 55% 50%, rgba(168, 80, 255, 0.18), transparent 40%);
          pointer-events: none;
          z-index: 1;
          animation: bg-shift 20s ease-in-out infinite;
        }
        @keyframes bg-shift {
          0%,
          100% {
            transform: translate(0, 0) scale(1);
          }
          50% {
            transform: translate(20px, -10px) scale(1.05);
          }
        }
        .hero-stage::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image:
            linear-gradient(rgba(255, 255, 255, 0.04) 1px, transparent 1px),
            linear-gradient(90deg, rgba(255, 255, 255, 0.04) 1px, transparent 1px);
          background-size: 50px 50px;
          transform: perspective(600px) rotateX(60deg) translateY(140px);
          transform-origin: center bottom;
          mask-image: linear-gradient(to top, black 18%, transparent 100%);
          pointer-events: none;
          z-index: 1;
        }

        /* ============== FLOATING POKEMON CARDS (BG) ============== */
        @keyframes float-card-1 {
          0%,
          100% {
            transform: translateY(0) rotate(var(--rot)) translateX(0);
          }
          50% {
            transform: translateY(-20px) rotate(calc(var(--rot) + 3deg)) translateX(10px);
          }
        }
        @keyframes float-card-2 {
          0%,
          100% {
            transform: translateY(0) rotate(var(--rot)) translateX(0);
          }
          50% {
            transform: translateY(15px) rotate(calc(var(--rot) - 4deg)) translateX(-8px);
          }
        }
        @keyframes float-card-3 {
          0%,
          100% {
            transform: translateY(0) rotate(var(--rot)) translateX(0);
          }
          50% {
            transform: translateY(-12px) rotate(calc(var(--rot) + 2deg)) translateX(-12px);
          }
        }
        .bg-cards {
          position: absolute;
          inset: 0;
          pointer-events: none;
          z-index: 2;
        }
        .bg-card {
          position: absolute;
          width: 110px;
          aspect-ratio: 2/3;
          border-radius: 10px;
          padding: 8px;
          display: flex;
          flex-direction: column;
          border: 1px solid rgba(255, 255, 255, 0.12);
          box-shadow: 0 12px 30px rgba(0, 0, 0, 0.5);
          opacity: 0.32;
          backdrop-filter: blur(1px);
        }
        .bg-card::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 10px;
          background: linear-gradient(
            135deg,
            transparent 30%,
            rgba(255, 255, 255, 0.22) 50%,
            transparent 70%
          );
          pointer-events: none;
        }
        .bg-card img {
          width: 100%;
          height: auto;
          image-rendering: auto;
          flex: 1;
          object-fit: contain;
          filter: drop-shadow(0 4px 12px rgba(0, 0, 0, 0.5));
        }
        .bg-card .num-bg {
          font-size: 6px;
          color: rgba(255, 255, 255, 0.95);
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.05em;
        }
        .bg-card .name-bg {
          font-size: 11px;
          color: white;
          text-align: center;
          text-shadow: 1px 1px 0 #1a1a1a;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          font-family: 'Bangers', 'Impact', sans-serif;
          line-height: 1;
        }
        /* MORE VIVID Type colors */
        .type-fire {
          background: linear-gradient(160deg, #ff8a40, #c1272d);
        }
        .type-water {
          background: linear-gradient(160deg, #5aa9ff, #1e3f8f);
        }
        .type-grass {
          background: linear-gradient(160deg, #8fdc5a, #2d6a1a);
        }
        .type-electric {
          background: linear-gradient(160deg, #ffe14a, #b8870a);
        }
        .type-psychic {
          background: linear-gradient(160deg, #ff6aa0, #a02050);
        }
        .type-rock {
          background: linear-gradient(160deg, #d4b850, #6a4d0a);
        }
        .type-poison {
          background: linear-gradient(160deg, #b850c0, #5a0a6a);
        }
        .type-bug {
          background: linear-gradient(160deg, #c0d028, #5a6a0a);
        }
        .type-flying {
          background: linear-gradient(160deg, #c0a8ff, #4d3da8);
        }
        .type-normal {
          background: linear-gradient(160deg, #c8b888, #6a5a3d);
        }
        .type-fighting {
          background: linear-gradient(160deg, #e04030, #8a0a0a);
        }
        .type-ground {
          background: linear-gradient(160deg, #ffd078, #a87a0a);
        }
        .type-ghost {
          background: linear-gradient(160deg, #8060b8, #2d1a5a);
        }
        .type-ice {
          background: linear-gradient(160deg, #a8e8e8, #3d8a8a);
        }
        .type-dragon {
          background: linear-gradient(160deg, #8050ff, #2d0aa8);
        }
        .type-dark {
          background: linear-gradient(160deg, #806858, #2d1a14);
        }
        .type-steel {
          background: linear-gradient(160deg, #d0d0e8, #5a5a78);
        }
        .type-fairy {
          background: linear-gradient(160deg, #ffaac0, #a04060);
        }

        /* Even 7-col × 4-row staggered grid */
        .bg-card {
          width: 96px;
        }
        .bg-card.c1 {
          top: 3%;
          left: 2%;
          --rot: -12deg;
          animation: float-card-1 6s ease-in-out infinite;
        }
        .bg-card.c2 {
          top: 5%;
          left: 16%;
          --rot: 8deg;
          animation: float-card-2 7s ease-in-out infinite;
        }
        .bg-card.c3 {
          top: 3%;
          left: 30%;
          --rot: -6deg;
          animation: float-card-3 8s ease-in-out infinite;
        }
        .bg-card.c4 {
          top: 6%;
          left: 44%;
          --rot: 10deg;
          animation: float-card-1 6.5s ease-in-out infinite;
        }
        .bg-card.c5 {
          top: 3%;
          left: 58%;
          --rot: -10deg;
          animation: float-card-2 7.5s ease-in-out infinite;
        }
        .bg-card.c6 {
          top: 5%;
          left: 72%;
          --rot: 6deg;
          animation: float-card-3 6.8s ease-in-out infinite;
        }
        .bg-card.c7 {
          top: 3%;
          left: 86%;
          --rot: -8deg;
          animation: float-card-2 7.2s ease-in-out infinite;
        }
        .bg-card.c8 {
          top: 27%;
          left: 2%;
          --rot: 12deg;
          animation: float-card-1 8.4s ease-in-out infinite;
        }
        .bg-card.c9 {
          top: 25%;
          left: 16%;
          --rot: -10deg;
          animation: float-card-2 7.4s ease-in-out infinite;
        }
        .bg-card.c10 {
          top: 28%;
          left: 30%;
          --rot: 8deg;
          animation: float-card-3 8.6s ease-in-out infinite;
          opacity: 0.24;
        }
        .bg-card.c11 {
          top: 26%;
          left: 44%;
          --rot: 14deg;
          animation: float-card-1 6.2s ease-in-out infinite;
          opacity: 0.22;
        }
        .bg-card.c12 {
          top: 28%;
          left: 58%;
          --rot: -6deg;
          animation: float-card-2 7.8s ease-in-out infinite;
          opacity: 0.24;
        }
        .bg-card.c13 {
          top: 25%;
          left: 72%;
          --rot: -12deg;
          animation: float-card-3 6.7s ease-in-out infinite;
        }
        .bg-card.c14 {
          top: 27%;
          left: 86%;
          --rot: 10deg;
          animation: float-card-1 8.1s ease-in-out infinite;
        }
        .bg-card.c15 {
          top: 50%;
          left: 2%;
          --rot: -6deg;
          animation: float-card-3 7.3s ease-in-out infinite;
        }
        .bg-card.c16 {
          top: 52%;
          left: 16%;
          --rot: 10deg;
          animation: float-card-2 8.2s ease-in-out infinite;
        }
        .bg-card.c17 {
          top: 50%;
          left: 30%;
          --rot: -12deg;
          animation: float-card-1 7.5s ease-in-out infinite;
          opacity: 0.22;
        }
        .bg-card.c18 {
          top: 53%;
          left: 44%;
          --rot: 16deg;
          animation: float-card-3 9s ease-in-out infinite;
          opacity: 0.18;
        }
        .bg-card.c19 {
          top: 50%;
          left: 58%;
          --rot: -14deg;
          animation: float-card-2 7.1s ease-in-out infinite;
          opacity: 0.22;
        }
        .bg-card.c20 {
          top: 52%;
          left: 72%;
          --rot: 14deg;
          animation: float-card-1 6.2s ease-in-out infinite;
        }
        .bg-card.c21 {
          top: 50%;
          left: 86%;
          --rot: -8deg;
          animation: float-card-3 8.6s ease-in-out infinite;
        }
        .bg-card.c22 {
          top: 75%;
          left: 2%;
          --rot: 6deg;
          animation: float-card-2 7.4s ease-in-out infinite;
        }
        .bg-card.c23 {
          top: 77%;
          left: 16%;
          --rot: -10deg;
          animation: float-card-1 7.9s ease-in-out infinite;
        }
        .bg-card.c24 {
          top: 75%;
          left: 30%;
          --rot: 8deg;
          animation: float-card-3 8.7s ease-in-out infinite;
        }
        .bg-card.c25 {
          top: 78%;
          left: 44%;
          --rot: -6deg;
          animation: float-card-2 7.8s ease-in-out infinite;
        }
        .bg-card.c26 {
          top: 75%;
          left: 58%;
          --rot: 10deg;
          animation: float-card-1 8.1s ease-in-out infinite;
        }
        .bg-card.c27 {
          top: 77%;
          left: 72%;
          --rot: -12deg;
          animation: float-card-3 6.9s ease-in-out infinite;
        }
        .bg-card.c28 {
          top: 75%;
          left: 86%;
          --rot: 14deg;
          animation: float-card-2 7.5s ease-in-out infinite;
        }

        /* ============== NAV ============== */
        .nav-bar {
          position: relative;
          z-index: 30;
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 32px 44px;
          background: linear-gradient(180deg, rgba(0, 0, 0, 0.35), transparent);
          backdrop-filter: blur(6px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        }
        .logo {
          font-family: 'Bungee', 'Inter', sans-serif;
          font-size: 24px;
          font-weight: 400;
          letter-spacing: 0.12em;
          color: white;
          display: flex;
          align-items: center;
          gap: 14px;
          text-shadow: 2px 2px 0 var(--accent);
        }
        .logo::before {
          content: '';
          width: 16px;
          height: 16px;
          background: var(--accent);
          border-radius: 50%;
          box-shadow:
            0 0 18px var(--accent),
            0 0 6px #fff;
        }
        .nav-items {
          display: flex;
          gap: 28px;
          font-size: 10px;
          color: rgba(255, 255, 255, 0.75);
          letter-spacing: 0.12em;
          align-items: center;
          text-transform: uppercase;
          font-family: 'Press Start 2P', monospace;
        }
        .nav-items span:first-child {
          color: white;
        }
        .nav-items .cta-nav {
          background: var(--accent);
          color: white;
          padding: 12px 22px;
          border-radius: 100px;
          font-size: 9px;
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.1em;
          box-shadow:
            0 6px 18px rgba(255, 56, 96, 0.5),
            inset 0 -3px 0 rgba(0, 0, 0, 0.25);
          cursor: pointer;
        }

        /* ============== STAGE (split layout) ============== */
        .stage {
          position: relative;
          display: grid;
          grid-template-columns: 1fr 1.2fr 1fr;
          align-items: center;
          height: calc(100% - 250px);
          padding: 0 44px;
          z-index: 10;
          gap: 24px;
        }
        .stage-left,
        .stage-right {
          position: relative;
          padding: 14px 14px 14px;
          background: linear-gradient(155deg, rgba(20, 15, 35, 0.55), rgba(10, 8, 20, 0.35));
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 14px;
          backdrop-filter: blur(14px) saturate(1.2);
          box-shadow:
            0 12px 40px rgba(0, 0, 0, 0.45),
            inset 0 1px 0 rgba(255, 255, 255, 0.08);
          overflow: visible;
          max-width: 320px;
        }
        .stage-left {
          justify-self: start;
        }
        .stage-right {
          justify-self: end;
          text-align: right;
        }

        .gb-screen {
          position: relative;
          background:
            repeating-linear-gradient(
              0deg,
              rgba(0, 0, 0, 0.05) 0px,
              rgba(0, 0, 0, 0.05) 1px,
              transparent 1px,
              transparent 3px
            ),
            linear-gradient(135deg, rgba(155, 188, 15, 0.22) 0%, rgba(107, 140, 15, 0.18) 100%);
          border: 1px solid rgba(155, 188, 15, 0.25);
          border-radius: 8px;
          padding: 16px 16px 14px;
          box-shadow: inset 0 0 18px rgba(0, 30, 0, 0.25);
          color: rgba(220, 240, 180, 0.92);
        }
        .gb-screen::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: 7px;
          background: radial-gradient(
            ellipse 80% 40% at 50% 0%,
            rgba(255, 255, 255, 0.06),
            transparent 70%
          );
          pointer-events: none;
        }
        .stage-left .gb-led,
        .stage-right .gb-led {
          position: absolute;
          top: 7px;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: radial-gradient(circle at 30% 30%, #ff7080, #c00020);
          box-shadow: 0 0 5px rgba(255, 48, 96, 0.6);
        }
        .stage-left .gb-led {
          left: 10px;
        }
        .stage-right .gb-led {
          right: 10px;
        }

        .panel-head {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 7px;
          color: rgba(220, 240, 180, 0.7);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          font-family: 'Press Start 2P', monospace;
          margin-bottom: 14px;
          padding-bottom: 10px;
          border-bottom: 1px dashed rgba(155, 188, 15, 0.18);
          line-height: 1.6;
        }
        .stage-right .panel-head {
          justify-content: flex-end;
        }
        .panel-head .dot-status {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: #9bbc0f;
          box-shadow: 0 0 6px rgba(155, 188, 15, 0.55);
        }
        .panel-head .dot-status.red {
          background: var(--accent);
          box-shadow: 0 0 8px var(--accent);
        }

        .stage-left h2,
        .stage-right h2 {
          font-family: 'Bangers', 'Impact', sans-serif;
          font-size: 48px;
          font-weight: 400;
          line-height: 0.94;
          letter-spacing: 0.04em;
          color: white;
          margin-bottom: 12px;
          text-shadow:
            2px 2px 0 #1a1a1a,
            3px 3px 0 rgba(255, 56, 96, 0.55);
          -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.55);
        }
        .stage-left h2 em,
        .stage-right h2 em {
          font-style: normal;
          background: linear-gradient(135deg, #ffd14a, #ff5a30 50%, #ff3860);
          -webkit-background-clip: text;
          background-clip: text;
          -webkit-text-fill-color: transparent;
          filter: drop-shadow(2px 2px 0 #1a1a1a);
        }
        .stage-left p,
        .stage-right p {
          font-size: 11px;
          color: rgba(220, 240, 180, 0.7);
          line-height: 1.65;
          font-family: 'Inter', sans-serif;
          letter-spacing: 0;
        }
        .stage-right p {
          margin-left: auto;
          max-width: 240px;
        }

        .cta-row {
          margin-top: 18px;
          display: flex;
          gap: 10px;
        }
        .stage-right .cta-row {
          justify-content: flex-end;
        }
        .btn {
          padding: 12px 18px;
          border-radius: 100px;
          font-size: 9px;
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          line-height: 1;
          cursor: pointer;
          border: none;
        }
        .btn.primary {
          background: white;
          color: #050510;
          box-shadow:
            0 4px 14px rgba(255, 255, 255, 0.2),
            inset 0 -3px 0 rgba(0, 0, 0, 0.15);
        }
        .btn.ghost {
          border: 1px solid rgba(255, 255, 255, 0.3);
          color: white;
          background: rgba(255, 255, 255, 0.04);
          box-shadow: inset 0 -3px 0 rgba(0, 0, 0, 0.25);
        }

        .stat-grid {
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          border-top: 1px dashed rgba(155, 188, 15, 0.18);
          padding-top: 12px;
        }
        .stat {
          text-align: right;
          padding-left: 8px;
          border-left: 1px solid rgba(155, 188, 15, 0.12);
        }
        .stat:first-child {
          border-left: none;
        }
        .stat .stat-num {
          font-family: 'Bangers', 'Impact', sans-serif;
          font-size: 28px;
          font-weight: 400;
          color: white;
          line-height: 1;
          letter-spacing: 0.04em;
          text-shadow: 2px 2px 0 #1a1a1a;
        }
        .stat .stat-lbl {
          font-size: 6.5px;
          color: rgba(220, 240, 180, 0.6);
          letter-spacing: 0.15em;
          text-transform: uppercase;
          margin-top: 6px;
          font-family: 'Press Start 2P', monospace;
          line-height: 1.5;
        }

        .live-row {
          margin-top: 14px;
          display: flex;
          align-items: center;
          justify-content: flex-end;
          gap: 10px;
          font-size: 7px;
          color: rgba(220, 240, 180, 0.7);
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.12em;
          text-transform: uppercase;
        }
        .live-row .pulse-dot {
          width: 8px;
          height: 8px;
          border-radius: 50%;
          background: var(--accent);
          box-shadow: 0 0 0 0 rgba(255, 56, 96, 0.6);
          animation: live-pulse 1.4s infinite;
        }
        @keyframes live-pulse {
          0% {
            box-shadow: 0 0 0 0 rgba(255, 56, 96, 0.7);
          }
          100% {
            box-shadow: 0 0 0 14px rgba(255, 56, 96, 0);
          }
        }

        /* ============== CENTER POKEBALL ============== */
        .center-stage {
          position: relative;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 18;
        }
        @keyframes float-soft {
          0%,
          100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-12px);
          }
        }
        .pokeball-wrap {
          position: relative;
          width: 260px;
          height: 260px;
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 15;
          cursor: pointer;
          transition: transform 0.25s ease;
        }
        .pokeball-wrap:hover {
          transform: scale(1.08);
        }
        .pokeball-wrap:active {
          transform: scale(0.95);
        }
        .pokeball-wrap:hover .ring-glow {
          background: radial-gradient(circle, rgba(255, 56, 96, 0.85), transparent 60%);
        }
        .pokeball-cta {
          position: absolute;
          bottom: -56px;
          left: 50%;
          transform: translateX(-50%);
          background: rgba(255, 56, 96, 0.95);
          color: white;
          padding: 12px 22px;
          border-radius: 100px;
          font-size: 10px;
          font-family: 'Press Start 2P', monospace;
          letter-spacing: 0.1em;
          text-transform: uppercase;
          box-shadow:
            0 8px 24px rgba(255, 56, 96, 0.55),
            0 0 18px rgba(255, 56, 96, 0.3),
            inset 0 -3px 0 rgba(0, 0, 0, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.25);
          white-space: nowrap;
          opacity: 0;
          transition:
            opacity 0.25s ease,
            transform 0.25s ease;
          z-index: 20;
          pointer-events: none;
        }
        .pokeball-cta::before {
          content: '▶';
          margin-right: 8px;
          color: white;
        }
        .pokeball-wrap:hover .pokeball-cta {
          opacity: 1;
          transform: translateX(-50%) translateY(-6px);
        }

        @keyframes ball-launch {
          0% {
            transform: scale(0.95) rotate(0deg);
          }
          20% {
            transform: scale(1.2) rotate(-8deg);
          }
          40% {
            transform: scale(1.05) rotate(8deg);
          }
          60% {
            transform: scale(1.15) rotate(-4deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        .pokeball-wrap.launch .pokeball-main {
          animation: ball-launch 0.7s ease-out;
        }

        @keyframes ball-hit {
          0% {
            transform: scale(1) rotate(0deg);
          }
          30% {
            transform: scale(1.06) rotate(-3deg);
          }
          60% {
            transform: scale(0.98) rotate(2deg);
          }
          100% {
            transform: scale(1) rotate(0deg);
          }
        }
        .pokeball-main.hit {
          animation: ball-hit 0.3s ease-out;
        }

        @keyframes flash {
          0% {
            opacity: 0;
          }
          20% {
            opacity: 0.85;
          }
          100% {
            opacity: 0;
          }
        }
        .flash-layer {
          position: absolute;
          inset: 0;
          background: radial-gradient(
            circle at center,
            rgba(255, 255, 255, 0.95),
            rgba(255, 56, 96, 0.6) 40%,
            transparent 80%
          );
          opacity: 0;
          pointer-events: none;
          z-index: 90;
        }
        .flash-layer.active {
          animation: flash 0.7s ease-out;
        }
        .pokeball-wrap .ring-glow {
          position: absolute;
          inset: -40px;
          background: radial-gradient(circle, rgba(255, 56, 96, 0.55), transparent 60%);
          border-radius: 50%;
          filter: blur(12px);
          z-index: 1;
          animation: pulse-glow 2.5s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%,
          100% {
            opacity: 0.6;
            transform: scale(1);
          }
          50% {
            opacity: 1;
            transform: scale(1.1);
          }
        }
        .pokeball-main {
          position: relative;
          width: 160px;
          height: 160px;
          z-index: 4;
          animation: float-soft 4s ease-in-out infinite;
        }
        .pokeball-main .ball {
          position: relative;
          width: 100%;
          height: 100%;
          border-radius: 50%;
          background: linear-gradient(
            180deg,
            #ff5a7a 0%,
            #ff3860 45%,
            #cc0030 50%,
            #fff 50%,
            #f5f5f5 100%
          );
          box-shadow:
            inset -12px -16px 30px rgba(0, 0, 0, 0.4),
            inset 8px 8px 20px rgba(255, 255, 255, 0.3),
            0 20px 50px rgba(255, 56, 96, 0.6),
            0 0 80px rgba(255, 56, 96, 0.4);
          border: 4px solid #1a1a1a;
          overflow: hidden;
        }
        .pokeball-main .ball::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 8px;
          background: #1a1a1a;
          transform: translateY(-50%);
        }
        .pokeball-main .ball::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 40px;
          height: 40px;
          background: white;
          border: 5px solid #1a1a1a;
          border-radius: 50%;
          transform: translate(-50%, -50%);
          box-shadow:
            inset 3px 3px 6px rgba(0, 0, 0, 0.2),
            0 0 20px rgba(255, 255, 255, 0.7);
          z-index: 2;
        }
        .pokeball-main .highlight {
          position: absolute;
          top: 10%;
          left: 18%;
          width: 32%;
          height: 22%;
          background: radial-gradient(ellipse, rgba(255, 255, 255, 0.8), transparent 70%);
          border-radius: 50%;
          filter: blur(2px);
          z-index: 3;
        }

        /* ============== BOUNCING POKEBALLS LAYER ============== */
        .bounce-layer {
          position: absolute;
          inset: 120px 0 100px 0;
          z-index: 12;
          pointer-events: none;
          overflow: hidden;
        }
        .bounce-layer :global(.bouncer) {
          position: absolute;
          width: 36px;
          height: 36px;
          border-radius: 50%;
          background: linear-gradient(180deg, #ff5a7a 45%, #cc0030 50%, #f5f5f5 50%, #fff 100%);
          border: 3px solid #1a1a1a;
          box-shadow:
            inset -4px -5px 8px rgba(0, 0, 0, 0.4),
            0 4px 14px rgba(255, 56, 96, 0.5),
            0 0 16px rgba(255, 56, 96, 0.3);
          overflow: hidden;
          will-change: transform;
        }
        .bounce-layer :global(.bouncer)::before {
          content: '';
          position: absolute;
          top: 50%;
          left: 0;
          right: 0;
          height: 3px;
          background: #1a1a1a;
          transform: translateY(-50%);
        }
        .bounce-layer :global(.bouncer)::after {
          content: '';
          position: absolute;
          top: 50%;
          left: 50%;
          width: 10px;
          height: 10px;
          background: white;
          border: 2px solid #1a1a1a;
          border-radius: 50%;
          transform: translate(-50%, -50%);
        }
        .bounce-layer :global(.bouncer.b-cyan) {
          background: linear-gradient(180deg, #5af0ff 45%, #0a8fb8 50%, #f5f5f5 50%, #fff 100%);
          box-shadow:
            inset -4px -5px 8px rgba(0, 0, 0, 0.4),
            0 4px 14px rgba(0, 200, 255, 0.5),
            0 0 16px rgba(0, 200, 255, 0.3);
        }
        .bounce-layer :global(.bouncer.b-gold) {
          background: linear-gradient(180deg, #ffea5a 45%, #b88c0a 50%, #f5f5f5 50%, #fff 100%);
          box-shadow:
            inset -4px -5px 8px rgba(0, 0, 0, 0.4),
            0 4px 14px rgba(255, 210, 0, 0.5),
            0 0 16px rgba(255, 210, 0, 0.3);
        }
        .bounce-layer :global(.bouncer.b-green) {
          background: linear-gradient(180deg, #6ee05a 45%, #1a8a2a 50%, #f5f5f5 50%, #fff 100%);
          box-shadow:
            inset -4px -5px 8px rgba(0, 0, 0, 0.4),
            0 4px 14px rgba(80, 220, 80, 0.5),
            0 0 16px rgba(80, 220, 80, 0.3);
        }
        .bounce-layer :global(.bouncer.b-purple) {
          background: linear-gradient(180deg, #c060ff 45%, #5a0aa8 50%, #f5f5f5 50%, #fff 100%);
          box-shadow:
            inset -4px -5px 8px rgba(0, 0, 0, 0.4),
            0 4px 14px rgba(180, 80, 255, 0.5),
            0 0 16px rgba(180, 80, 255, 0.3);
        }

        @keyframes burst {
          0% {
            transform: translate(-50%, -50%) scale(0);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -50%) scale(4);
            opacity: 0;
          }
        }
        .burst {
          position: absolute;
          width: 80px;
          height: 80px;
          border-radius: 50%;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0);
          animation: burst 700ms ease-out forwards;
        }
        .burst.b1 {
          background: radial-gradient(circle, #fff 0%, #ffd14a 30%, #ff5a30 60%, transparent 80%);
        }
        .burst.b2 {
          background: radial-gradient(circle, #fff 0%, #5af0ff 30%, #0a8fb8 60%, transparent 80%);
        }
        .burst.b3 {
          background: radial-gradient(circle, #fff 0%, #c060ff 30%, #5a0aa8 60%, transparent 80%);
        }

        @keyframes spark {
          0% {
            transform: translate(0, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(var(--dx, 40px), var(--dy, 40px)) scale(0);
            opacity: 0;
          }
        }
        .spark {
          position: absolute;
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #fffbe0;
          box-shadow: 0 0 8px #fff8a0;
          animation: spark 700ms ease-out forwards;
          pointer-events: none;
        }

        @keyframes spawn-pop {
          0% {
            transform: translate(-50%, -50%) scale(0) rotate(-20deg);
            opacity: 0;
          }
          35% {
            transform: translate(-50%, -55%) scale(1.15) rotate(8deg);
            opacity: 1;
          }
          55% {
            transform: translate(-50%, -55%) scale(1) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -90%) scale(0.7) rotate(0deg);
            opacity: 0;
          }
        }
        .spawn {
          position: absolute;
          width: 120px;
          height: 120px;
          pointer-events: none;
          transform: translate(-50%, -50%) scale(0);
          animation: spawn-pop 2.2s ease-out forwards;
          filter: drop-shadow(0 0 18px rgba(255, 255, 255, 0.6))
            drop-shadow(0 8px 20px rgba(0, 0, 0, 0.6));
        }
        .spawn img {
          width: 100%;
          height: 100%;
          object-fit: contain;
        }
        .spawn .label {
          position: absolute;
          bottom: -20px;
          left: 50%;
          transform: translateX(-50%);
          font-size: 20px;
          font-family: 'Bangers', 'Impact', sans-serif;
          color: white;
          text-transform: uppercase;
          letter-spacing: 0.06em;
          text-shadow:
            2px 2px 0 #1a1a1a,
            3px 3px 0 rgba(255, 56, 96, 0.7),
            0 0 16px rgba(255, 255, 255, 0.4);
          white-space: nowrap;
          -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.6);
        }

        /* ============== TICKER + CORNER LABELS ============== */
        @keyframes marquee {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }
        .ticker {
          position: absolute;
          bottom: 0;
          left: 0;
          right: 0;
          background: linear-gradient(0deg, rgba(0, 0, 0, 0.35), transparent);
          backdrop-filter: blur(6px) saturate(1.2);
          -webkit-backdrop-filter: blur(6px) saturate(1.2);
          border-top: 1px solid rgba(255, 255, 255, 0.06);
          overflow: hidden;
          padding: 22px 0;
          z-index: 40;
          box-shadow: 0 -2px 12px rgba(0, 0, 0, 0.15);
        }
        .ticker-track {
          display: flex;
          white-space: nowrap;
          align-items: center;
          animation: marquee 40s linear infinite;
          font-size: 26px;
          font-weight: 400;
          letter-spacing: 0.06em;
          color: white;
          text-transform: uppercase;
          font-family: 'Bangers', 'Impact', sans-serif;
          text-shadow:
            2px 2px 0 #1a1a1a,
            3px 3px 0 rgba(255, 56, 96, 0.5);
          -webkit-text-stroke: 0.5px rgba(0, 0, 0, 0.5);
        }
        .ticker-item {
          display: inline-flex;
          align-items: center;
          gap: 14px;
          padding: 0 36px;
        }
        .ticker-item .sep {
          color: var(--accent);
          font-size: 14px;
        }
        .ticker-item .avatar {
          width: 52px;
          height: 52px;
          display: inline-block;
          image-rendering: pixelated;
          filter: drop-shadow(0 2px 6px rgba(0, 0, 0, 0.6));
          object-fit: contain;
        }
        .ticker-item .num {
          font-size: 11px;
          font-family: 'JetBrains Mono', monospace;
          color: var(--accent);
          letter-spacing: 0.1em;
          margin-left: 4px;
        }

        .corner-label {
          position: absolute;
          bottom: 110px;
          font-size: 7px;
          color: rgba(255, 255, 255, 0.55);
          letter-spacing: 0.12em;
          text-transform: uppercase;
          z-index: 30;
          font-family: 'Press Start 2P', monospace;
          line-height: 1.8;
        }
        .corner-label.left {
          left: 44px;
        }
        .corner-label.right {
          right: 44px;
          text-align: right;
        }
      `}</style>
    </div>
  );
}
