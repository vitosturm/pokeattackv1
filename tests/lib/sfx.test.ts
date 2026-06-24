import { describe, it, expect } from 'vitest';
import { playCritSound, playFaintSound, playStatusSound } from '@/lib/sfx';

describe('sfx', () => {
  it('does not throw when the Web Audio API is unavailable (jsdom has no AudioContext)', () => {
    expect(() => playCritSound()).not.toThrow();
    expect(() => playFaintSound()).not.toThrow();
    expect(() => playStatusSound('burn')).not.toThrow();
    expect(() => playStatusSound('poison')).not.toThrow();
    expect(() => playStatusSound('paralysis')).not.toThrow();
  });
});
