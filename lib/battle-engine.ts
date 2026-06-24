import type { Move, PokemonSummary } from './types';
import { computeDamage } from './damage';

function expectedDamage(attacker: PokemonSummary, defender: PokemonSummary, move: Move): number {
  if (move.damageClass === 'status' || move.power <= 0) return 0;
  return computeDamage(
    { level: 50, types: attacker.types, stats: attacker.stats },
    { types: defender.types, stats: defender.stats },
    { power: move.power, type: move.type, damageClass: move.damageClass },
    () => 1,
  );
}

export function pickOpponentMove(
  oppMon: PokemonSummary,
  moves: Move[],
  playerMon: PokemonSummary,
): Move {
  let best = moves[0];
  let bestDamage = expectedDamage(oppMon, playerMon, best);
  for (let i = 1; i < moves.length; i++) {
    const dmg = expectedDamage(oppMon, playerMon, moves[i]);
    if (dmg > bestDamage) {
      best = moves[i];
      bestDamage = dmg;
    }
  }
  return best;
}
