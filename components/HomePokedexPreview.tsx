'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import Tilt from 'react-parallax-tilt';
import { motion, useMotionValue } from 'framer-motion';
import './glass-card.css';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FEATURED_POKEMON } from '@/lib/featured-pokemon';
import { animatedSpriteUrl, cryUrl, spriteUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';
import { useRoster, MAX_ROSTER } from '@/hooks/useRoster';
import { useSound } from '@/hooks/useSound';
import { TypeBadge } from '@/components/TypeBadge';
import type { PokemonType } from '@/lib/type-chart';
import type { PokemonSummary } from '@/lib/types';

const CARD_W = 180; // visual width (176px card + 4px buffer for shadows/edges)
const CARD_GAP = 16;
const STEP = CARD_W + CARD_GAP; // distance to scroll per arrow click

export function HomePokedexPreview() {
  const { roster, add, remove } = useRoster();
  const playCry = useSound();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0 });
  const [progress, setProgress] = useState(0);

  const x = useMotionValue(0);

  // Compute drag bounds whenever the layout changes
  useEffect(() => {
    function measure() {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return;
      const overflow = Math.max(0, track.scrollWidth - viewport.clientWidth);
      setDragBounds({ left: -overflow, right: 0 });
    }
    measure();
    window.addEventListener('resize', measure);
    return () => window.removeEventListener('resize', measure);
  }, []);

  // Track drag x to show progress bar
  useEffect(() => {
    const unsub = x.on('change', (v) => {
      const range = dragBounds.left;
      if (range === 0) {
        setProgress(0);
        return;
      }
      setProgress(Math.min(1, Math.max(0, v / range)));
    });
    return () => unsub();
  }, [x, dragBounds.left]);

  function scrollBy(direction: -1 | 1) {
    const current = x.get();
    const next = Math.min(0, Math.max(dragBounds.left, current - direction * STEP * 2));
    // Animate using framer-motion's spring physics via .set on a tweened path
    const start = current;
    const distance = next - start;
    const startTime = performance.now();
    const duration = 450;
    function step(now: number) {
      const t = Math.min(1, (now - startTime) / duration);
      // easeOutCubic
      const eased = 1 - Math.pow(1 - t, 3);
      x.set(start + distance * eased);
      if (t < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  const inRoster = (id: number) => roster.some((p) => p.id === id);

  function handleQuickAdd(p: { id: number; name: string; type: string }) {
    if (inRoster(p.id) || roster.length >= MAX_ROSTER) return;
    const summary: PokemonSummary = {
      id: p.id,
      name: p.name,
      types: [p.type as PokemonType],
      stats: { hp: 50, attack: 50, defense: 50, specialAttack: 50, specialDefense: 50, speed: 50 },
      sprite: spriteUrl(p.id),
    };
    add(summary);
    playCry(cryUrl(p.id));
  }

  const canScrollLeft = progress > 0.001;
  const canScrollRight = progress < 0.999;

  return (
    <section className="pt-0 pb-20 px-6 max-w-6xl mx-auto -mt-40 md:-mt-32">
      <header className="flex items-end justify-between mb-8">
        <div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: '-80px' }}
            transition={{ duration: 0.6 }}
            className="text-4xl mb-2"
            style={{
              fontFamily: 'Bangers, Impact, sans-serif',
              letterSpacing: '0.04em',
              textShadow: '2px 2px 0 #1a1a1a, 3px 3px 0 rgba(255,56,96,0.55)',
            }}
          >
            Choose your starters
          </motion.h2>
          <p className="text-white/60 text-sm">
            Pick up to 6 Pokémon to claim as yours, then bring 3 into battle. ({roster.length}/
            {MAX_ROSTER} picked)
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/pokedex"
            className="text-[10px] uppercase font-bold text-[#ff3860] hover:underline"
            style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
          >
            View all 151 →
          </Link>
        </div>
      </header>

      {/* Carousel viewport */}
      <div className="relative">
        {/* Left arrow */}
        <motion.button
          type="button"
          aria-label="Scroll left"
          onClick={() => scrollBy(-1)}
          initial={false}
          animate={{ opacity: canScrollLeft ? 1 : 0.25, scale: canScrollLeft ? 1 : 0.9 }}
          whileHover={{ scale: canScrollLeft ? 1.1 : 0.9 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          disabled={!canScrollLeft}
          className="absolute left-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-lg disabled:cursor-default"
        >
          <ChevronLeft size={20} />
        </motion.button>

        {/* Right arrow */}
        <motion.button
          type="button"
          aria-label="Scroll right"
          onClick={() => scrollBy(1)}
          initial={false}
          animate={{ opacity: canScrollRight ? 1 : 0.25, scale: canScrollRight ? 1 : 0.9 }}
          whileHover={{ scale: canScrollRight ? 1.1 : 0.9 }}
          whileTap={{ scale: 0.92 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
          disabled={!canScrollRight}
          className="absolute right-0 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-black/60 backdrop-blur-md border border-white/15 flex items-center justify-center text-white shadow-lg disabled:cursor-default"
        >
          <ChevronRight size={20} />
        </motion.button>

        {/* Edge fades */}
        <div className="pointer-events-none absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-[#0a0a0f] to-transparent z-[1]" />
        <div className="pointer-events-none absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-[#0a0a0f] to-transparent z-[1]" />

        <div ref={viewportRef} className="overflow-hidden px-6">
          <motion.div
            ref={trackRef}
            className="flex gap-4 cursor-grab active:cursor-grabbing"
            drag="x"
            dragConstraints={dragBounds}
            dragElastic={0.12}
            dragTransition={{ bounceStiffness: 240, bounceDamping: 22 }}
            style={{ x }}
          >
            {FEATURED_POKEMON.map((p, idx) => {
              const inR = inRoster(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.04, 0.6) }}
                  whileHover={{ y: -6 }}
                  className="shrink-0"
                >
                  <Tilt
                    tiltMaxAngleX={10}
                    tiltMaxAngleY={10}
                    glareEnable
                    glareMaxOpacity={0.2}
                    glareColor="#ffffff"
                    glarePosition="all"
                    transitionSpeed={1500}
                  >
                    <div className="glass-card w-44 rounded-xl p-3 flex flex-col items-center gap-2 relative overflow-hidden">
                      <span className="text-[10px] text-white/50 self-start font-mono">
                        #{padId(p.id)}
                      </span>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={animatedSpriteUrl(p.id)}
                        alt={p.name}
                        className="w-28 h-28 object-contain pointer-events-none select-none"
                        style={{ imageRendering: 'pixelated' }}
                        draggable={false}
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = spriteUrl(p.id);
                        }}
                      />
                      <span className="capitalize font-semibold text-sm">{p.name}</span>
                      <TypeBadge type={p.type as PokemonType} />
                      <motion.button
                        whileTap={{ scale: 0.95 }}
                        onClick={() => (inR ? remove(p.id) : handleQuickAdd(p))}
                        disabled={!inR && roster.length >= MAX_ROSTER}
                        className={`w-full mt-2 py-1.5 rounded-md text-[10px] uppercase font-bold transition ${
                          inR
                            ? 'bg-white/10 hover:bg-white/15 text-white border border-white/20'
                            : roster.length >= MAX_ROSTER
                              ? 'bg-white/5 text-white/30 cursor-not-allowed'
                              : 'bg-[#ff3860] hover:opacity-90 text-white'
                        }`}
                        style={{
                          fontFamily: '"Press Start 2P", monospace',
                          letterSpacing: '0.08em',
                        }}
                      >
                        {inR ? 'Remove' : 'Add'}
                      </motion.button>
                    </div>
                  </Tilt>
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Scroll progress bar */}
        <div className="mt-4 mx-6 h-1 rounded-full bg-white/5 overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-[#ff3860] to-[#ffd14a]"
            style={{ width: `${progress * 100}%` }}
            transition={{ type: 'spring', stiffness: 200, damping: 30 }}
          />
        </div>
      </div>
    </section>
  );
}
