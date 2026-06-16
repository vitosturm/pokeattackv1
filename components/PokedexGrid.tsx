'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { TypeBadge } from '@/components/TypeBadge';
import { TYPES, type PokemonType } from '@/lib/type-chart';
import { useRoster, MAX_ROSTER } from '@/hooks/useRoster';
import { useSound } from '@/hooks/useSound';
import { cryUrl } from '@/lib/pokeapi';
import { padId } from '@/lib/utils';
import type { PokemonSummary } from '@/lib/types';
import './glass-card.css';

interface Props {
  all: PokemonSummary[];
}

export function PokedexGrid({ all }: Props) {
  const [query, setQuery] = useState('');
  const [activeType, setActiveType] = useState<PokemonType | null>(null);
  const { roster, add, remove } = useRoster();
  const playCry = useSound();

  const rosterIds = useMemo(() => new Set(roster.map((p) => p.id)), [roster]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return all.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !String(p.id).includes(q)) return false;
      if (activeType && !p.types.includes(activeType)) return false;
      return true;
    });
  }, [all, query, activeType]);

  function handleAdd(p: PokemonSummary) {
    if (rosterIds.has(p.id)) {
      toast(`${p.name} is already in your roster.`);
      return;
    }
    if (roster.length >= MAX_ROSTER) {
      toast.error(`Your list is full (${MAX_ROSTER}/${MAX_ROSTER}).`);
      return;
    }
    add(p);
    playCry(cryUrl(p.id));
    toast.success(`Added ${p.name} to your Pokemons (${roster.length + 1}/${MAX_ROSTER}).`);
  }

  return (
    <>
      <div className="flex flex-col gap-3 mb-6">
        <div className="flex gap-3 items-center">
          <Input
            placeholder="Search name or #id…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="max-w-xs"
          />
          <span className="text-sm text-white/60">
            {filtered.length} / {all.length}
          </span>
          <span className="ml-auto text-sm text-white/60">
            My Pokemons: {roster.length} / {MAX_ROSTER}
          </span>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            type="button"
            onClick={() => setActiveType(null)}
            className={`px-2.5 py-0.5 rounded-full text-xs uppercase font-semibold border ${
              activeType === null
                ? 'bg-white text-black border-white'
                : 'border-white/20 text-white/70'
            }`}
          >
            all
          </button>
          {TYPES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setActiveType(t === activeType ? null : t)}
              className={`${
                activeType === null || activeType === t ? 'opacity-100' : 'opacity-40'
              } transition-opacity`}
            >
              <TypeBadge type={t} />
            </button>
          ))}
        </div>
      </div>

      <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6">
        {filtered.map((p) => {
          const inRoster = rosterIds.has(p.id);
          return (
            <div
              key={p.id}
              className="glass-card relative overflow-hidden rounded-xl p-3 flex flex-col items-center gap-2"
            >
              <Link href={`/pokemon/${p.id}`} className="contents">
                <span className="text-[10px] text-white/50 self-start font-mono">
                  #{padId(p.id)}
                </span>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={p.sprite}
                  alt={p.name}
                  className="w-24 h-24 object-contain"
                  loading="lazy"
                />
                <span className="capitalize font-semibold text-sm">{p.name}</span>
                <div className="flex gap-1 flex-wrap justify-center">
                  {p.types.map((t) => (
                    <TypeBadge key={t} type={t} />
                  ))}
                </div>
              </Link>
              <Button
                size="sm"
                variant={inRoster ? 'outline' : 'default'}
                disabled={!inRoster && roster.length >= MAX_ROSTER}
                onClick={() => (inRoster ? remove(p.id) : handleAdd(p))}
                className="w-full mt-1"
              >
                {inRoster ? 'Remove' : 'Add'}
              </Button>
            </div>
          );
        })}
      </div>

      {filtered.length === 0 && <p className="text-center text-white/50 py-12">No matches.</p>}
    </>
  );
}
