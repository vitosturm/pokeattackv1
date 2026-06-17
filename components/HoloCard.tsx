'use client';

import { useCallback, useRef, type CSSProperties, type ReactNode } from 'react';
import Link from 'next/link';
import { padId } from '@/lib/utils';
import { TypeBadge } from '@/components/TypeBadge';
import type { PokemonType } from '@/lib/type-chart';
import type { PokemonSummary } from '@/lib/types';
import './HoloCard.css';

// Per-type foil accent colours (exposed as --holo-1/2/3). Types not listed fall
// back to the rainbow defaults defined in HoloCard.css.
const HOLO: Partial<Record<PokemonType, [string, string, string]>> = {
  fire: ['#ff9a3c', '#ff3860', '#ffd14a'],
  water: ['#5fd0ff', '#3c6bff', '#9be8ff'],
  grass: ['#7be07b', '#2fae6b', '#d6ff7b'],
  electric: ['#ffe14a', '#ffb13c', '#fff7b0'],
  psychic: ['#ff7bd5', '#b06bff', '#ffd0f0'],
  ice: ['#9be8ff', '#6fd0e0', '#e6ffff'],
  dragon: ['#9b6bff', '#3c5bff', '#c0a0ff'],
  ghost: ['#a06bff', '#6b4ba0', '#d0b0ff'],
  rock: ['#d6c06f', '#a08038', '#efe0a0'],
  fairy: ['#ff9bc0', '#ff6fa0', '#ffd0e0'],
  fighting: ['#ff7b5f', '#c03028', '#ffb0a0'],
  normal: ['#d0d0b0', '#a8a878', '#efefe0'],
};

interface HoloCardProps {
  pokemon: PokemonSummary;
  /** Image to display in the frame (HD artwork or animated GIF). */
  imageSrc: string;
  imageStyle?: CSSProperties;
  onImageError?: (e: React.SyntheticEvent<HTMLImageElement>) => void;
  /** If set, the sprite/name links to the detail page. */
  href?: string;
  /** Optional footer (e.g. an Add/Remove button) rendered below the stats. */
  footer?: ReactNode;
  className?: string;
}

const STAT_ROWS: { label: string; key: keyof PokemonSummary['stats'] }[] = [
  { label: 'ATK', key: 'attack' },
  { label: 'DEF', key: 'defense' },
  { label: 'SPD', key: 'speed' },
];

export function HoloCard({
  pokemon,
  imageSrc,
  imageStyle,
  onImageError,
  href,
  footer,
  className,
}: HoloCardProps) {
  const ref = useRef<HTMLDivElement>(null);
  const rafRef = useRef<number | null>(null);

  const primary = pokemon.types[0];
  const holo = HOLO[primary];
  const styleVars = holo
    ? ({ '--holo-1': holo[0], '--holo-2': holo[1], '--holo-3': holo[2] } as CSSProperties)
    : undefined;

  const handleMove = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    const el = ref.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    const rect = el.getBoundingClientRect();
    const px = Math.min(100, Math.max(0, ((e.clientX - rect.left) / rect.width) * 100));
    const py = Math.min(100, Math.max(0, ((e.clientY - rect.top) / rect.height) * 100));
    // Remap to a tighter band so the foil drifts subtly (matches Simey's adjust()).
    const bx = 37 + (px / 100) * 26;
    const by = 33 + (py / 100) * 34;
    const cx = px - 50;
    const cy = py - 50;
    const fromCenter = Math.min(1, Math.hypot(cx, cy) / 50);
    rafRef.current = requestAnimationFrame(() => {
      el.style.setProperty('--pointer-x', `${px}%`);
      el.style.setProperty('--pointer-y', `${py}%`);
      el.style.setProperty('--background-x', `${bx}%`);
      el.style.setProperty('--background-y', `${by}%`);
      el.style.setProperty('--rotate-x', `${-cx / 3.5}deg`);
      el.style.setProperty('--rotate-y', `${cy / 3.5}deg`);
      el.style.setProperty('--pointer-from-center', `${fromCenter}`);
      el.style.setProperty('--card-opacity', '1');
    });
  }, []);

  const handleLeave = useCallback(() => {
    const el = ref.current;
    if (!el) return;
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    el.style.setProperty('--pointer-x', '50%');
    el.style.setProperty('--pointer-y', '50%');
    el.style.setProperty('--background-x', '50%');
    el.style.setProperty('--background-y', '50%');
    el.style.setProperty('--rotate-x', '0deg');
    el.style.setProperty('--rotate-y', '0deg');
    el.style.setProperty('--pointer-from-center', '0');
    el.style.setProperty('--card-opacity', '0');
  }, []);

  const image = (
    /* eslint-disable-next-line @next/next/no-img-element */
    <img
      src={imageSrc}
      alt={pokemon.name}
      className="w-full h-full object-contain pointer-events-none select-none"
      style={imageStyle}
      draggable={false}
      loading="lazy"
      onError={onImageError}
    />
  );

  const name = <span className="capitalize font-bold text-sm leading-tight">{pokemon.name}</span>;

  return (
    <div className={`holo-card-scene ${className ?? ''}`}>
      <div
        ref={ref}
        className="holo-card"
        style={styleVars}
        onPointerMove={handleMove}
        onPointerLeave={handleLeave}
      >
        <div className="holo-card__shine" />
        <div className="holo-card__sparkle" />
        <div className="holo-card__glare" />

        <div className="holo-card__content flex flex-col gap-1.5 p-3">
          {/* Header: name + HP */}
          <div className="flex items-baseline justify-between gap-2">
            {href ? (
              <Link href={href} className="hover:underline">
                {name}
              </Link>
            ) : (
              name
            )}
            <span className="text-[10px] font-bold text-white/80 whitespace-nowrap">
              HP {pokemon.stats.hp}
            </span>
          </div>

          {/* Framed artwork */}
          <div className="relative rounded-md overflow-hidden border border-white/15 bg-black/20 aspect-square">
            {href ? (
              <Link href={href} className="block w-full h-full">
                {image}
              </Link>
            ) : (
              image
            )}
            <span className="absolute top-1 left-1 text-[9px] text-white/60 font-mono">
              #{padId(pokemon.id)}
            </span>
          </div>

          {/* Types */}
          <div className="flex gap-1 flex-wrap">
            {pokemon.types.map((t) => (
              <TypeBadge key={t} type={t} />
            ))}
          </div>

          {/* Stats as "attacks" */}
          <dl className="grid grid-cols-3 gap-1 text-center">
            {STAT_ROWS.map(({ label, key }) => (
              <div key={key} className="rounded bg-white/5 py-0.5">
                <dt className="text-[8px] uppercase text-white/50 leading-none">{label}</dt>
                <dd className="text-xs font-bold tabular-nums">{pokemon.stats[key]}</dd>
              </div>
            ))}
          </dl>

          {footer}
        </div>
      </div>
    </div>
  );
}
