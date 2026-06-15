'use client';

import { useCallback, useSyncExternalStore } from 'react';
import type { PokemonSummary } from '@/lib/types';
import { PokemonSummarySchema } from '@/lib/types';
import { z } from 'zod';

export const ROSTER_KEY = 'pokeattack:roster';
export const MAX_ROSTER = 6;

const StoredSchema = z.array(PokemonSummarySchema);

function read(): PokemonSummary[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = window.localStorage.getItem(ROSTER_KEY);
    if (!raw) return [];
    return StoredSchema.parse(JSON.parse(raw));
  } catch {
    window.localStorage.removeItem(ROSTER_KEY);
    return [];
  }
}

const listeners = new Set<() => void>();
function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}
function emit() {
  for (const cb of listeners) cb();
}
let cache: PokemonSummary[] | null = null;
function write(next: PokemonSummary[]) {
  window.localStorage.setItem(ROSTER_KEY, JSON.stringify(next));
  cache = next;
  emit();
}

function getSnapshot(): PokemonSummary[] {
  if (cache === null || listeners.size === 0) cache = read();
  return cache;
}
function refresh() { cache = read(); }

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === ROSTER_KEY) { refresh(); emit(); }
  });
}

export function useRoster() {
  const roster = useSyncExternalStore(subscribe, getSnapshot, () => []);

  const add = useCallback((p: PokemonSummary) => {
    const current = read();
    if (current.some((x) => x.id === p.id)) return;
    if (current.length >= MAX_ROSTER) return;
    const next = [...current, p];
    write(next); refresh();
  }, []);

  const remove = useCallback((id: number) => {
    const next = read().filter((x) => x.id !== id);
    write(next); refresh();
  }, []);

  const reorder = useCallback((from: number, to: number) => {
    const current = read();
    if (from < 0 || to < 0 || from >= current.length || to >= current.length) return;
    const next = current.slice();
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m);
    write(next); refresh();
  }, []);

  const clear = useCallback(() => { write([]); refresh(); }, []);

  return { roster, add, remove, reorder, clear };
}
