'use client';

import { useEffect, useMemo, useRef, useSyncExternalStore } from 'react';
import { spriteUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';
import { FEATURED_POKEMON, type FeaturedPokemon } from '@/lib/featured-pokemon';
import './AnimatedBackdrop.css';

const subscribeNoop = () => () => {};
function useIsClient(): boolean {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

function rand(min: number, max: number) {
  return min + Math.random() * (max - min);
}

function shuffle<T>(arr: readonly T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface PlacedCard {
  p: FeaturedPokemon;
  x: number;
  y: number;
  w: number;
  h: number;
  rot: number;
  delay: number;
}

function rectsOverlapAmount(
  a: { x: number; y: number; w: number; h: number },
  b: { x: number; y: number; w: number; h: number },
): number {
  const ix = Math.max(0, Math.min(a.x + a.w, b.x + b.w) - Math.max(a.x, b.x));
  const iy = Math.max(0, Math.min(a.y + a.h, b.y + b.h) - Math.max(a.y, b.y));
  return ix * iy;
}

// Collision-aware random placement. Each card overlaps at most one existing card,
// and that single overlap is < maxOverlapRatio of the card's area.
function scatterCards(
  count: number,
  sizeMin: number,
  sizeMax: number,
  maxOverlapRatio: number,
  gap: number,
  vpW: number,
  vpH: number,
): PlacedCard[] {
  const pool = shuffle(FEATURED_POKEMON);
  const placed: PlacedCard[] = [];
  for (let i = 0; i < count; i++) {
    const p = pool[i % pool.length] as FeaturedPokemon;
    const w = Math.round(rand(sizeMin, sizeMax));
    const h = Math.round(w * 1.5);
    let best: PlacedCard | null = null;
    for (let attempt = 0; attempt < 120; attempt++) {
      const x = rand(-w * 0.2, vpW - w * 0.8);
      const y = rand(-h * 0.2, vpH - h * 0.8);
      const cand = { x: x - gap, y: y - gap, w: w + 2 * gap, h: h + 2 * gap };
      let overlaps = 0;
      let ok = true;
      const area = w * h;
      for (const r of placed) {
        const o = rectsOverlapAmount(cand, r);
        if (o > 0) {
          overlaps++;
          if (overlaps > 1) {
            ok = false;
            break;
          }
          if (o / area > maxOverlapRatio) {
            ok = false;
            break;
          }
        }
      }
      if (ok) {
        best = { p, x, y, w, h, rot: rand(-15, 15), delay: -Math.random() * 10 };
        break;
      }
    }
    if (best) placed.push(best);
  }
  return placed;
}

export function AnimatedBackdrop() {
  const isClient = useIsClient();
  const backRef = useRef<HTMLDivElement | null>(null);
  const midRef = useRef<HTMLDivElement | null>(null);
  const frontRef = useRef<HTMLDivElement | null>(null);
  const bounceRef = useRef<HTMLDivElement | null>(null);
  const trailsRef = useRef<HTMLDivElement | null>(null);
  const ripplesRef = useRef<HTMLDivElement | null>(null);
  const sparklesRef = useRef<HTMLDivElement | null>(null);
  const flashesRef = useRef<HTMLDivElement | null>(null);
  const popsRef = useRef<HTMLDivElement | null>(null);

  // Layout cards once on client mount (SSR has empty placeholders to avoid hydration mismatch)
  const layout = useMemo(() => {
    if (!isClient) {
      return { back: [] as PlacedCard[], mid: [] as PlacedCard[], front: [] as PlacedCard[] };
    }
    const vpW = window.innerWidth;
    const vpH = window.innerHeight;
    return {
      back: scatterCards(28, 130, 175, 0.12, 4, vpW, vpH),
      mid: scatterCards(55, 80, 115, 0.1, 6, vpW, vpH),
      front: scatterCards(38, 55, 80, 0.1, 6, vpW, vpH),
    };
  }, [isClient]);

  // Bouncing balls (existing v3 behaviour) + trails + ripples + sparkles + bursts
  useEffect(() => {
    if (!isClient) return;
    const layer = bounceRef.current;
    const trails = trailsRef.current;
    const ripples = ripplesRef.current;
    const sparkles = sparklesRef.current;
    const flashes = flashesRef.current;
    if (!layer || !trails || !ripples || !sparkles || !flashes) return;

    // Respect prefers-reduced-motion
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    const BALL = 36;
    const COLOR_HEX: Record<string, string> = {
      '': '#ff3860',
      'b-cyan': '#5af0ff',
      'b-gold': '#ffea5a',
      'b-green': '#6ee05a',
      'b-purple': '#c060ff',
    };
    const colors = ['', 'b-cyan', 'b-gold', 'b-green', 'b-purple'];

    const balls = colors.map((c) => {
      const el = document.createElement('div');
      el.className = `bouncer ${c}`.trim();
      layer.appendChild(el);
      const speed = 1.0 + Math.random() * 0.6;
      const a = Math.random() * Math.PI * 2;
      return {
        el,
        c,
        x: Math.random() * (window.innerWidth - BALL),
        y: Math.random() * (window.innerHeight - BALL),
        vx: Math.cos(a) * speed,
        vy: Math.sin(a) * speed,
        baseSpeed: speed,
      };
    });

    function spawnRipple(x: number, y: number, color: string) {
      const r = document.createElement('div');
      r.className = 'ripple';
      r.style.left = x + 'px';
      r.style.top = y + 'px';
      r.style.border = `2px solid ${color}`;
      r.style.background = `radial-gradient(circle, ${color}33, transparent 70%)`;
      ripples!.appendChild(r);
      setTimeout(() => r.remove(), 800);
    }

    let raf = 0;
    let frame = 0;
    function tick() {
      frame++;
      const W = window.innerWidth;
      const H = window.innerHeight;
      for (const b of balls) {
        b.x += b.vx;
        b.y += b.vy;
        let bumped = false;
        let bx = 0;
        let by = 0;
        if (b.x <= 0) {
          b.x = 0;
          b.vx = Math.abs(b.vx);
          bumped = true;
          bx = 0;
          by = b.y + BALL / 2;
        } else if (b.x + BALL >= W) {
          b.x = W - BALL;
          b.vx = -Math.abs(b.vx);
          bumped = true;
          bx = W;
          by = b.y + BALL / 2;
        }
        if (b.y <= 0) {
          b.y = 0;
          b.vy = Math.abs(b.vy);
          bumped = true;
          bx = b.x + BALL / 2;
          by = 0;
        } else if (b.y + BALL >= H) {
          b.y = H - BALL;
          b.vy = -Math.abs(b.vy);
          bumped = true;
          bx = b.x + BALL / 2;
          by = H;
        }
        if (bumped) spawnRipple(bx, by, COLOR_HEX[b.c]);
        b.el.style.transform = `translate(${b.x}px, ${b.y}px)`;
        if (frame % 4 === 0) {
          const t = document.createElement('div');
          t.className = 'trail';
          t.style.left = b.x + BALL / 2 - 7 + 'px';
          t.style.top = b.y + BALL / 2 - 7 + 'px';
          t.style.background = `radial-gradient(circle, ${COLOR_HEX[b.c]}, transparent 70%)`;
          t.style.boxShadow = `0 0 12px ${COLOR_HEX[b.c]}`;
          trails!.appendChild(t);
          setTimeout(() => t.remove(), 700);
        }
      }
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);

    // Sparkles
    const SPARK_COLORS = ['#ff3860', '#5af0ff', '#ffea5a', '#6ee05a', '#c060ff', '#fff'];
    const sparkleTimer = setInterval(() => {
      const s = document.createElement('div');
      s.className = 'sparkle';
      s.style.left = Math.random() * window.innerWidth + 'px';
      s.style.top = window.innerHeight - 20 + 'px';
      const col = SPARK_COLORS[Math.floor(Math.random() * SPARK_COLORS.length)];
      s.style.background = col;
      s.style.boxShadow = `0 0 8px ${col}`;
      s.style.animationDuration = 4 + Math.random() * 4 + 's';
      sparkles!.appendChild(s);
      setTimeout(() => s.remove(), 8000);
    }, 150);

    // Speed bursts
    let burstTimer: ReturnType<typeof setTimeout> | null = null;
    function speedBurst() {
      const flash = document.createElement('div');
      flash.className = 'scene-flash';
      flashes!.appendChild(flash);
      setTimeout(() => flash.remove(), 1200);
      balls.forEach((b) => {
        b.el.classList.add('burst');
        b.vx *= 2.2;
        b.vy *= 2.2;
      });
      setTimeout(() => {
        balls.forEach((b) => {
          b.el.classList.remove('burst');
          const cur = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
          b.vx = (b.vx / cur) * b.baseSpeed;
          b.vy = (b.vy / cur) * b.baseSpeed;
        });
      }, 800);
      burstTimer = setTimeout(speedBurst, 8000 + Math.random() * 6000);
    }
    burstTimer = setTimeout(speedBurst, 4000);

    return () => {
      cancelAnimationFrame(raf);
      clearInterval(sparkleTimer);
      if (burstTimer) clearTimeout(burstTimer);
      for (const b of balls) b.el.remove();
    };
  }, [isClient]);

  // Scroll + cursor driven layer transforms; pop-up cards every 500px
  useEffect(() => {
    if (!isClient) return;
    const back = backRef.current;
    const mid = midRef.current;
    const front = frontRef.current;
    const pops = popsRef.current;
    if (!back || !mid || !front || !pops) return;

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return;
    }

    let scrollY = 0;
    let mouseX = 0;
    let mouseY = 0;
    let smoothMouseX = 0;
    let smoothMouseY = 0;
    let lastScrollY = 0;
    let smoothScrollVel = 0;
    let lastPopAt = 0;

    const onScroll = () => {
      scrollY = window.scrollY;
    };
    const onMouse = (e: MouseEvent) => {
      mouseX = e.clientX / window.innerWidth - 0.5;
      mouseY = e.clientY / window.innerHeight - 0.5;
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('mousemove', onMouse, { passive: true });

    function applyTo(el: HTMLDivElement, rate: number, rotPer1k: number, tilt: number) {
      const ty = scrollY * rate;
      const rot = (scrollY / 1000) * rotPer1k;
      const tx = -smoothMouseX * tilt + smoothScrollVel * 0.3;
      const tyExtra = -smoothMouseY * tilt * 0.4;
      el.style.transform = `translate(${tx}px, ${ty + tyExtra}px) rotate(${rot}deg)`;
    }

    function spawnPopCard() {
      const p = FEATURED_POKEMON[Math.floor(Math.random() * FEATURED_POKEMON.length)];
      const el = document.createElement('div');
      el.className = `pop-card t-${p.type}`;
      el.style.left = window.innerWidth / 2 + 'px';
      el.style.top = window.innerHeight / 2 + 'px';
      const num = document.createElement('div');
      num.className = 'num';
      num.textContent = '#' + padId(p.id);
      const img = document.createElement('img');
      img.src = spriteUrl(p.id);
      img.alt = '';
      const name = document.createElement('div');
      name.className = 'name';
      name.textContent = p.name;
      el.appendChild(num);
      el.appendChild(img);
      el.appendChild(name);
      pops!.appendChild(el);
      setTimeout(() => el.remove(), 2500);
    }

    let raf = 0;
    function loop() {
      smoothMouseX += (mouseX - smoothMouseX) * 0.08;
      smoothMouseY += (mouseY - smoothMouseY) * 0.08;
      const vel = scrollY - lastScrollY;
      smoothScrollVel += (vel - smoothScrollVel) * 0.15;
      lastScrollY = scrollY;
      applyTo(back!, -0.15, 4, 12);
      applyTo(mid!, -0.4, -6, 28);
      applyTo(front!, -0.7, 8, 50);
      if (scrollY > lastPopAt + 500) {
        lastPopAt = scrollY;
        spawnPopCard();
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('mousemove', onMouse);
    };
  }, [isClient]);

  return (
    <div className="animated-backdrop" aria-hidden="true">
      <div className="layer layer-back" ref={backRef}>
        {layout.back.map((c, i) => (
          <div
            key={`b${i}`}
            className={`card t-${c.p.type}`}
            style={
              {
                left: c.x,
                top: c.y,
                width: c.w,
                '--r': `${c.rot}deg`,
                animationDelay: `${c.delay}s`,
              } as React.CSSProperties
            }
          >
            <div className="num">#{padId(c.p.id)}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spriteUrl(c.p.id)} alt="" loading="lazy" />
            <div className="name">{c.p.name}</div>
          </div>
        ))}
      </div>
      <div className="layer layer-mid" ref={midRef}>
        {layout.mid.map((c, i) => (
          <div
            key={`m${i}`}
            className={`card t-${c.p.type}`}
            style={
              {
                left: c.x,
                top: c.y,
                width: c.w,
                '--r': `${c.rot}deg`,
                animationDelay: `${c.delay}s`,
              } as React.CSSProperties
            }
          >
            <div className="num">#{padId(c.p.id)}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spriteUrl(c.p.id)} alt="" loading="lazy" />
            <div className="name">{c.p.name}</div>
          </div>
        ))}
      </div>
      <div className="layer layer-front" ref={frontRef}>
        {layout.front.map((c, i) => (
          <div
            key={`f${i}`}
            className={`card t-${c.p.type}`}
            style={
              {
                left: c.x,
                top: c.y,
                width: c.w,
                '--r': `${c.rot}deg`,
                animationDelay: `${c.delay}s`,
              } as React.CSSProperties
            }
          >
            <div className="num">#{padId(c.p.id)}</div>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={spriteUrl(c.p.id)} alt="" loading="lazy" />
            <div className="name">{c.p.name}</div>
          </div>
        ))}
      </div>
      <div className="layer sparkles-layer" ref={sparklesRef} />
      <div className="layer trails-layer" ref={trailsRef} />
      <div className="layer bounce-layer" ref={bounceRef} />
      <div className="layer ripples-layer" ref={ripplesRef} />
      <div className="layer flashes-layer" ref={flashesRef} />
      <div className="layer pops-layer" ref={popsRef} />
    </div>
  );
}
