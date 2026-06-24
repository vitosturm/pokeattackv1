import { describe, it, expect } from 'vitest';
import { PokemonSummarySchema, MoveSchema } from '@/lib/types';

describe('PokemonSummarySchema', () => {
  it('accepts a valid summary', () => {
    const ok = PokemonSummarySchema.parse({
      id: 25,
      name: 'pikachu',
      types: ['electric'],
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
      sprite: 'https://example.com/25.png',
    });
    expect(ok.name).toBe('pikachu');
  });
  it('rejects unknown types', () => {
    expect(() =>
      PokemonSummarySchema.parse({
        id: 1,
        name: 'x',
        types: ['banana'],
        stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
        sprite: 'x',
      }),
    ).toThrow();
  });
});

describe('MoveSchema', () => {
  it('accepts a valid move', () => {
    expect(
      MoveSchema.parse({
        id: 1,
        name: 'tackle',
        type: 'normal',
        power: 40,
        pp: 35,
        damageClass: 'physical',
      }).name,
    ).toBe('tackle');
  });
  it('rejects damage_class instead of damageClass', () => {
    expect(() =>
      MoveSchema.parse({
        id: 1,
        name: 'tackle',
        type: 'normal',
        power: 40,
        pp: 35,
        damage_class: 'physical',
      }),
    ).toThrow();
  });
  it('still accepts a move with no accuracy/ailment/highCrit fields (backward compatible)', () => {
    const m = MoveSchema.parse({
      id: 1,
      name: 'tackle',
      type: 'normal',
      power: 40,
      pp: 35,
      damageClass: 'physical',
    });
    expect(m.accuracy).toBeUndefined();
    expect(m.ailment).toBeUndefined();
  });
  it('accepts accuracy, ailment, ailmentChance, and highCrit when provided', () => {
    const m = MoveSchema.parse({
      id: 2,
      name: 'body-slam',
      type: 'normal',
      power: 85,
      pp: 15,
      damageClass: 'physical',
      accuracy: 100,
      ailment: 'paralysis',
      ailmentChance: 30,
      highCrit: false,
    });
    expect(m.accuracy).toBe(100);
    expect(m.ailment).toBe('paralysis');
    expect(m.ailmentChance).toBe(30);
  });
  it('accepts a null accuracy (never misses)', () => {
    const m = MoveSchema.parse({
      id: 3,
      name: 'swift',
      type: 'normal',
      power: 60,
      pp: 20,
      damageClass: 'special',
      accuracy: null,
    });
    expect(m.accuracy).toBeNull();
  });
  it('rejects an unknown ailment name', () => {
    expect(() =>
      MoveSchema.parse({
        id: 4,
        name: 'x',
        type: 'normal',
        power: 40,
        pp: 10,
        damageClass: 'physical',
        ailment: 'sleep',
      }),
    ).toThrow();
  });
});
