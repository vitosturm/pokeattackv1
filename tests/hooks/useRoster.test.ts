import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useRoster, ROSTER_KEY, MAX_ROSTER } from '@/hooks/useRoster';
import type { PokemonSummary } from '@/lib/types';

const sample = (id: number): PokemonSummary => ({
  id, name: `p${id}`, types: ['normal'],
  stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
  sprite: 'x',
});

describe('useRoster', () => {
  beforeEach(() => localStorage.clear());

  it('starts empty', () => {
    const { result } = renderHook(() => useRoster());
    expect(result.current.roster).toEqual([]);
  });

  it('adds a Pokémon', () => {
    const { result } = renderHook(() => useRoster());
    act(() => result.current.add(sample(1)));
    expect(result.current.roster.map((p) => p.id)).toEqual([1]);
  });

  it('does not add duplicates', () => {
    const { result } = renderHook(() => useRoster());
    act(() => { result.current.add(sample(1)); result.current.add(sample(1)); });
    expect(result.current.roster).toHaveLength(1);
  });

  it('caps at MAX_ROSTER', () => {
    const { result } = renderHook(() => useRoster());
    act(() => {
      for (let i = 1; i <= MAX_ROSTER + 2; i++) result.current.add(sample(i));
    });
    expect(result.current.roster).toHaveLength(MAX_ROSTER);
  });

  it('removes a Pokémon', () => {
    const { result } = renderHook(() => useRoster());
    act(() => { result.current.add(sample(1)); result.current.add(sample(2)); });
    act(() => result.current.remove(1));
    expect(result.current.roster.map((p) => p.id)).toEqual([2]);
  });

  it('persists across hook instances', () => {
    const { result: r1 } = renderHook(() => useRoster());
    act(() => r1.current.add(sample(7)));
    const { result: r2 } = renderHook(() => useRoster());
    expect(r2.current.roster.map((p) => p.id)).toEqual([7]);
  });

  it('resets when storage is corrupted', () => {
    localStorage.setItem(ROSTER_KEY, '{not json');
    const { result } = renderHook(() => useRoster());
    expect(result.current.roster).toEqual([]);
  });
});
