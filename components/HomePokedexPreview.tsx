'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { motion, useMotionValue } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FEATURED_POKEMON } from '@/lib/featured-pokemon';
import { animatedSpriteUrl, cryUrl, spriteUrl } from '@/lib/pokeapi';
import { useRoster, MAX_ROSTER } from '@/hooks/useRoster';
import { useSound } from '@/hooks/useSound';
import { TypeBadge } from '@/components/TypeBadge';
import { HoloCard } from '@/components/HoloCard';
import { Button } from '@/components/ui/button';
import { TYPES, type PokemonType } from '@/lib/type-chart';
import type { PokemonSummary } from '@/lib/types';

const CARD_W = 180; // visual width (176px card + 4px buffer for shadows/edges)
const CARD_GAP = 16;
const STEP = CARD_W + CARD_GAP; // distance to scroll per arrow click

const MotionButton = motion.create(Button);

type Featured = (typeof FEATURED_POKEMON)[number];

// Map a featured entry (which now carries real Gen-1 base stats) to a PokemonSummary
// for the HoloCard frame and for persisting into the roster.
function toSummary(p: Featured): PokemonSummary {
  return {
    id: p.id,
    name: p.name,
    types: [p.type as PokemonType],
    stats: { ...p.stats },
    sprite: spriteUrl(p.id),
  };
}

export function HomePokedexPreview() {
  const { roster, add, remove } = useRoster();
  const playCry = useSound();
  const trackRef = useRef<HTMLDivElement | null>(null);
  const viewportRef = useRef<HTMLDivElement | null>(null);
  const [dragBounds, setDragBounds] = useState({ left: 0, right: 0 });
  const [progress, setProgress] = useState(0);
  const [activeType, setActiveType] = useState<PokemonType | null>(null);

  const x = useMotionValue(0);

  // Only the types actually present in the featured set, in canonical TYPES order.
  const availableTypes = useMemo(() => {
    const present = new Set(FEATURED_POKEMON.map((p) => p.type as PokemonType));
    return TYPES.filter((t) => present.has(t));
  }, []);

  // Featured list filtered to the active type (or all when no filter).
  const visible = useMemo(
    () => (activeType ? FEATURED_POKEMON.filter((p) => p.type === activeType) : FEATURED_POKEMON),
    [activeType],
  );

  // Up to 3 rows; fewer when the filtered set is small so it stays centered.
  const rows = Math.min(3, Math.max(1, visible.length));

  // Compute drag bounds whenever the layout or the filtered set changes.
  useEffect(() => {
    function measure() {
      const track = trackRef.current;
      const viewport = viewportRef.current;
      if (!track || !viewport) return;
      const overflow = Math.max(0, track.scrollWidth - viewport.clientWidth);
      setDragBounds({ left: -overflow, right: 0 });
    }
    // Reset to the left edge so a shorter filtered track never stays out of bounds,
    // then measure after the new grid has laid out.
    x.set(0);
    const raf = requestAnimationFrame(measure);
    window.addEventListener('resize', measure);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', measure);
    };
  }, [activeType, rows, x]);

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

  function handleQuickAdd(p: Featured) {
    if (inRoster(p.id) || roster.length >= MAX_ROSTER) return;
    add(toSummary(p));
    playCry(cryUrl(p.id));
  }

  const hasOverflow = dragBounds.left < 0;
  const canScrollLeft = hasOverflow && progress > 0.001;
  const canScrollRight = hasOverflow && progress < 0.999;

  return (
    <section className="relative z-30 pt-0 pb-20 px-11 -mt-40 md:-mt-32">
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

      {/* Type filter — compresses the carousel to a single type */}
      <div className="mb-5">
        <p
          className="text-[10px] uppercase text-white/50 mb-2"
          style={{ fontFamily: '"Press Start 2P", monospace', letterSpacing: '0.12em' }}
        >
          Filter by type
        </p>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveType(null)}
            className={`px-2.5 py-0.5 rounded-full text-xs uppercase font-semibold border transition ${
              activeType === null
                ? 'bg-white text-black border-white'
                : 'border-white/20 text-white/70 hover:text-white'
            }`}
          >
            all
          </button>
          {availableTypes.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t === activeType ? null : t)}
              className={`transition ${
                activeType === t ? 'scale-110' : 'opacity-60 hover:opacity-100'
              }`}
            >
              <TypeBadge type={t} />
            </button>
          ))}
        </div>
      </div>

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

        <div ref={viewportRef} className="overflow-hidden">
          <motion.div
            ref={trackRef}
            className="grid grid-flow-col gap-4 cursor-grab active:cursor-grabbing"
            style={{ x, gridTemplateRows: `repeat(${rows}, minmax(0, 1fr))` }}
            drag="x"
            dragConstraints={dragBounds}
            dragElastic={0.12}
            dragTransition={{ bounceStiffness: 240, bounceDamping: 22 }}
          >
            {visible.map((p, idx) => {
              const inR = inRoster(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-80px' }}
                  transition={{ duration: 0.5, delay: Math.min(idx * 0.03, 0.45) }}
                  whileHover={{ y: -6 }}
                  className="w-44"
                >
                  <HoloCard
                    pokemon={toSummary(p)}
                    imageSrc={animatedSpriteUrl(p.id)}
                    imageStyle={{ imageRendering: 'pixelated' }}
                    href={`/pokemon/${p.id}`}
                    onImageError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = spriteUrl(p.id);
                    }}
                    footer={
                      <MotionButton
                        whileTap={{ scale: 0.95 }}
                        size="sm"
                        variant={inR ? 'outline' : 'default'}
                        onClick={() => (inR ? remove(p.id) : handleQuickAdd(p))}
                        // Stop the press from starting the carousel drag, which would
                        // otherwise swallow the click on this button.
                        onPointerDownCapture={(e) => e.stopPropagation()}
                        disabled={!inR && roster.length >= MAX_ROSTER}
                        className="w-full mt-1"
                      >
                        {inR ? 'Remove' : 'Add'}
                      </MotionButton>
                    }
                  />
                </motion.div>
              );
            })}
          </motion.div>
        </div>

        {/* Scroll progress bar — only meaningful when the track overflows */}
        {hasOverflow && (
          <div className="mt-4 mx-6 h-1 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-[#ff3860] to-[#ffd14a]"
              style={{ width: `${progress * 100}%` }}
              transition={{ type: 'spring', stiffness: 200, damping: 30 }}
            />
          </div>
        )}
      </div>

      {visible.length === 0 && (
        <p className="text-center text-white/50 py-8">No featured Pokémon of this type.</p>
      )}
    </section>
  );
}
