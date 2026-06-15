import { typeMultiplier, type PokemonType } from './type-chart';

export interface Attacker {
  level: number;
  types: readonly PokemonType[];
  stats: { attack: number; specialAttack: number };
}
export interface Defender {
  types: readonly PokemonType[];
  stats: { defense: number; specialDefense: number };
}
export interface Move {
  power: number;
  type: PokemonType;
  damageClass: 'physical' | 'special';
}

export function computeDamage(
  attacker: Attacker,
  defender: Defender,
  move: Move,
  rand: () => number = () => 0.85 + Math.random() * 0.15,
): number {
  const eff = typeMultiplier(move.type, [...defender.types]);
  if (eff === 0) return 0;

  const A = move.damageClass === 'physical' ? attacker.stats.attack : attacker.stats.specialAttack;
  const D =
    move.damageClass === 'physical' ? defender.stats.defense : defender.stats.specialDefense;

  const stab = attacker.types.includes(move.type) ? 1.5 : 1;
  const base = (((2 * attacker.level) / 5 + 2) * move.power * (A / D)) / 50 + 2;
  const dmg = base * stab * eff * rand();
  return Math.max(1, Math.floor(dmg));
}
