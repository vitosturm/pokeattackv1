import { describe, it, expect } from 'vitest';
import { PokemonSummarySchema, MoveSchema } from '@/lib/types';

describe('PokemonSummarySchema', () => {
  it('accepts a valid summary', () => {
    const ok = PokemonSummarySchema.parse({
      id: 25, name: 'pikachu', types: ['electric'],
      stats: { hp: 35, attack: 55, defense: 40, specialAttack: 50, specialDefense: 50, speed: 90 },
      sprite: 'https://example.com/25.png',
    });
    expect(ok.name).toBe('pikachu');
  });
  it('rejects unknown types', () => {
    expect(() => PokemonSummarySchema.parse({
      id: 1, name: 'x', types: ['banana'],
      stats: { hp: 1, attack: 1, defense: 1, specialAttack: 1, specialDefense: 1, speed: 1 },
      sprite: 'x',
    })).toThrow();
  });
});

describe('MoveSchema', () => {
  it('accepts a valid move', () => {
    expect(MoveSchema.parse({
      id: 1, name: 'tackle', type: 'normal', power: 40, pp: 35, damageClass: 'physical',
    }).name).toBe('tackle');
  });
  it('rejects damage_class instead of damageClass', () => {
    expect(() => MoveSchema.parse({
      id: 1, name: 'tackle', type: 'normal', power: 40, pp: 35, damage_class: 'physical',
    })).toThrow();
  });
});
