import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { useSound } from '@/hooks/useSound';
import { setMuted } from '@/lib/muteState';

describe('useSound', () => {
  let playSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    playSpy = vi
      .spyOn(window.HTMLMediaElement.prototype, 'play')
      .mockImplementation(() => Promise.resolve());
  });

  afterEach(() => {
    setMuted(false);
    playSpy.mockRestore();
  });

  it('plays audio when not muted', () => {
    setMuted(false);
    const { result } = renderHook(() => useSound());
    act(() => {
      result.current('https://example.com/cry.ogg');
    });
    expect(playSpy).toHaveBeenCalledTimes(1);
  });

  it('does not play audio when muted', () => {
    setMuted(true);
    const { result } = renderHook(() => useSound());
    act(() => {
      result.current('https://example.com/cry.ogg');
    });
    expect(playSpy).not.toHaveBeenCalled();
  });
});
