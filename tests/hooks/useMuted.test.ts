import { describe, it, expect, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useMuted } from '@/hooks/useMuted';
import { toggleMuted, setMuted } from '@/lib/muteState';

describe('useMuted', () => {
  beforeEach(() => {
    localStorage.clear();
    setMuted(false);
  });

  it('returns the current mute state', () => {
    const { result } = renderHook(() => useMuted());
    expect(result.current).toBe(false);
  });

  it('re-renders with the new value when muteState changes', () => {
    const { result } = renderHook(() => useMuted());
    act(() => {
      toggleMuted();
    });
    expect(result.current).toBe(true);
  });

  it('unsubscribes on unmount (no error on further state changes)', () => {
    const { unmount } = renderHook(() => useMuted());
    unmount();
    expect(() => toggleMuted()).not.toThrow();
  });
});
