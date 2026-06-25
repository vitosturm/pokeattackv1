import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { playCritSound, playFaintSound, playStatusSound } from '@/lib/sfx';
import { setMuted } from '@/lib/muteState';

function installFakeAudioContext() {
  const createOscillator = vi.fn(() => ({
    type: 'square',
    frequency: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
    connect: vi.fn(),
    start: vi.fn(),
    stop: vi.fn(),
  }));
  class FakeAudioContext {
    currentTime = 0;
    destination = {};
    createOscillator = createOscillator;
    createGain = () => ({
      gain: { setValueAtTime: vi.fn(), linearRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    });
  }
  vi.stubGlobal('AudioContext', FakeAudioContext);
  return createOscillator;
}

describe('sfx muted', () => {
  let createOscillator: ReturnType<typeof installFakeAudioContext>;

  beforeEach(() => {
    createOscillator = installFakeAudioContext();
  });

  afterEach(() => {
    setMuted(false);
    vi.unstubAllGlobals();
  });

  it('skips oscillator creation entirely when muted', () => {
    setMuted(true);
    playCritSound();
    playFaintSound();
    playStatusSound('burn');
    expect(createOscillator).not.toHaveBeenCalled();
  });

  it('creates an oscillator when not muted', () => {
    setMuted(false);
    playCritSound();
    expect(createOscillator).toHaveBeenCalledTimes(1);
  });
});
