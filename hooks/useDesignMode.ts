'use client';

import { useCallback, useSyncExternalStore } from 'react';

export const DESIGN_MODE_KEY = 'pokeattack:design-mode';

export type DesignMode = 'classic' | 'video';

function isDesignMode(value: unknown): value is DesignMode {
  return value === 'classic' || value === 'video';
}

function read(): DesignMode {
  if (typeof window === 'undefined') return 'classic';
  try {
    const raw = window.localStorage.getItem(DESIGN_MODE_KEY);
    return isDesignMode(raw) ? raw : 'classic';
  } catch {
    window.localStorage.removeItem(DESIGN_MODE_KEY);
    return 'classic';
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
let cache: DesignMode | null = null;
function write(next: DesignMode) {
  window.localStorage.setItem(DESIGN_MODE_KEY, next);
  cache = next;
  emit();
}

function getSnapshot(): DesignMode {
  if (cache === null || listeners.size === 0) cache = read();
  return cache;
}
function refresh() {
  cache = read();
}

if (typeof window !== 'undefined') {
  window.addEventListener('storage', (e) => {
    if (e.key === DESIGN_MODE_KEY) {
      refresh();
      emit();
    }
  });
}

export function useDesignMode() {
  const mode = useSyncExternalStore(subscribe, getSnapshot, () => 'classic' as const);

  const setMode = useCallback((next: DesignMode) => {
    write(next);
    refresh();
  }, []);

  return { mode, setMode };
}
