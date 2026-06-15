import { describe, it, expect } from 'vitest';
import { typeMultiplier, TYPES } from '@/lib/type-chart';

describe('typeMultiplier', () => {
  it('returns 2 for super-effective (water > fire)', () => {
    expect(typeMultiplier('water', ['fire'])).toBe(2);
  });
  it('returns 0.5 for not very effective (fire > water)', () => {
    expect(typeMultiplier('fire', ['water'])).toBe(0.5);
  });
  it('returns 0 for immune (normal > ghost)', () => {
    expect(typeMultiplier('normal', ['ghost'])).toBe(0);
  });
  it('multiplies for dual types (electric > water/flying = 4x)', () => {
    expect(typeMultiplier('electric', ['water', 'flying'])).toBe(4);
  });
  it('returns 1 for neutral (normal > normal)', () => {
    expect(typeMultiplier('normal', ['normal'])).toBe(1);
  });
  it('exports exactly 18 types', () => {
    expect(TYPES).toHaveLength(18);
  });
});
