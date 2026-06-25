import { describe, it, expect, beforeEach } from 'vitest';
import { isMuted, setMuted, toggleMuted, subscribeMuted } from '@/lib/muteState';

describe('muteState', () => {
  beforeEach(() => {
    localStorage.clear();
    setMuted(false);
  });

  it('defaults to unmuted', () => {
    expect(isMuted()).toBe(false);
  });

  it('setMuted updates the flag and persists to localStorage', () => {
    setMuted(true);
    expect(isMuted()).toBe(true);
    expect(localStorage.getItem('pokeattack:battle-muted')).toBe('true');
  });

  it('toggleMuted flips the current value', () => {
    expect(isMuted()).toBe(false);
    toggleMuted();
    expect(isMuted()).toBe(true);
    toggleMuted();
    expect(isMuted()).toBe(false);
  });

  it('subscribeMuted calls back on change and the unsubscribe stops further calls', () => {
    let calls = 0;
    const unsubscribe = subscribeMuted(() => {
      calls += 1;
    });

    setMuted(true);
    expect(calls).toBe(1);

    unsubscribe();
    setMuted(false);
    expect(calls).toBe(1);
  });

  it('subscribeMuted does not call back when setMuted is given the same value', () => {
    let calls = 0;
    setMuted(true);
    subscribeMuted(() => {
      calls += 1;
    });
    setMuted(true);
    expect(calls).toBe(0);
  });
});
