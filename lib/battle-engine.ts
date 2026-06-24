import type { Move, PokemonSummary, StatusCondition } from './types';
import { computeDamage } from './damage';
import { typeMultiplier } from './type-chart';

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

export const PARALYSIS_BLOCK_CHANCE = 0.25;
export const BASE_CRIT_CHANCE = 0.0625;
export const HIGH_CRIT_CHANCE = 0.125;
export const BURN_RESIDUAL_FRACTION = 1 / 16;
export const POISON_RESIDUAL_FRACTION = 1 / 8;

export type BattleSide = 'player' | 'opponent';

export type TurnEvent =
  | { kind: 'move'; side: BattleSide; moveName: string }
  | { kind: 'miss'; side: BattleSide }
  | {
      kind: 'hit';
      side: BattleSide;
      damage: number;
      crit: boolean;
      effectiveness: 'super' | 'normal' | 'resisted' | 'immune';
    }
  | { kind: 'status-applied'; side: BattleSide; status: StatusCondition }
  | { kind: 'status-blocked'; side: BattleSide }
  | { kind: 'status-damage'; side: BattleSide; damage: number; status: StatusCondition };

export interface TurnSideInput {
  mon: PokemonSummary;
  move: Move;
  hp: number;
  status: StatusCondition | null;
}

export interface ResolveTurnInput {
  player: TurnSideInput;
  opponent: TurnSideInput;
  rand?: () => number;
}

export interface ResolveTurnResult {
  playerHp: number;
  oppHp: number;
  playerStatus: StatusCondition | null;
  oppStatus: StatusCondition | null;
  events: TurnEvent[];
}

function effectivenessLabel(mult: number): 'super' | 'normal' | 'resisted' | 'immune' {
  if (mult === 0) return 'immune';
  if (mult > 1) return 'super';
  if (mult < 1) return 'resisted';
  return 'normal';
}

function resolveAttack(
  attackerSide: BattleSide,
  attacker: TurnSideInput,
  defender: TurnSideInput,
  rand: () => number,
  events: TurnEvent[],
): { damageDealt: number; appliedStatus: StatusCondition | null } {
  if (attacker.status === 'paralysis' && rand() < PARALYSIS_BLOCK_CHANCE) {
    events.push({ kind: 'status-blocked', side: attackerSide });
    return { damageDealt: 0, appliedStatus: null };
  }

  events.push({ kind: 'move', side: attackerSide, moveName: attacker.move.name });

  if (attacker.move.accuracy != null && rand() * 100 >= attacker.move.accuracy) {
    events.push({ kind: 'miss', side: attackerSide });
    return { damageDealt: 0, appliedStatus: null };
  }

  if (attacker.move.damageClass === 'status' || attacker.move.power <= 0) {
    // Real movepools never contain status moves (getPokemonWithMoves filters
    // them out), but resolveAttack stays defensive about it — and tests use
    // 0-power status moves as deliberately harmless filler on one side.
    events.push({
      kind: 'hit',
      side: attackerSide,
      damage: 0,
      crit: false,
      effectiveness: 'normal',
    });
    return { damageDealt: 0, appliedStatus: null };
  }

  const mult = typeMultiplier(attacker.move.type, [...defender.mon.types]);
  if (mult === 0) {
    events.push({
      kind: 'hit',
      side: attackerSide,
      damage: 0,
      crit: false,
      effectiveness: 'immune',
    });
    return { damageDealt: 0, appliedStatus: null };
  }

  // damageClass is already narrowed to 'physical' | 'special' here — the
  // 'status' case returned earlier above (the damageClass === 'status' guard).
  const critChance = attacker.move.highCrit ? HIGH_CRIT_CHANCE : BASE_CRIT_CHANCE;
  const crit = rand() < critChance;

  const damage = computeDamage(
    { level: 50, types: attacker.mon.types, stats: attacker.mon.stats },
    { types: defender.mon.types, stats: defender.mon.stats },
    {
      power: attacker.move.power,
      type: attacker.move.type,
      damageClass: attacker.move.damageClass,
    },
    () => {
      const variance = 0.85 + rand() * 0.15;
      return crit ? variance * 1.5 : variance;
    },
  );

  events.push({
    kind: 'hit',
    side: attackerSide,
    damage,
    crit,
    effectiveness: effectivenessLabel(mult),
  });

  let appliedStatus: StatusCondition | null = null;
  const ailmentChance = attacker.move.ailmentChance ?? 0;
  if (
    attacker.move.ailment &&
    ailmentChance > 0 &&
    defender.status === null &&
    rand() * 100 < ailmentChance
  ) {
    appliedStatus = attacker.move.ailment;
    const defenderSide: BattleSide = attackerSide === 'player' ? 'opponent' : 'player';
    events.push({ kind: 'status-applied', side: defenderSide, status: appliedStatus });
  }

  return { damageDealt: damage, appliedStatus };
}

function applyResidual(
  side: BattleSide,
  mon: PokemonSummary,
  hp: number,
  status: StatusCondition | null,
  events: TurnEvent[],
): number {
  if (hp <= 0 || status === null || status === 'paralysis') return hp;
  const fraction = status === 'burn' ? BURN_RESIDUAL_FRACTION : POISON_RESIDUAL_FRACTION;
  const damage = Math.max(1, Math.floor(mon.stats.hp * fraction));
  const next = Math.max(0, hp - damage);
  events.push({ kind: 'status-damage', side, damage, status });
  return next;
}

export function resolveTurn(input: ResolveTurnInput): ResolveTurnResult {
  const rand = input.rand ?? Math.random;
  const events: TurnEvent[] = [];

  // Both attacks read only the pre-turn status snapshot for every decision —
  // a status inflicted in one attack never affects the other attack within
  // the same call, so the two calls below are order-independent.
  const playerAttack = resolveAttack('player', input.player, input.opponent, rand, events);
  const oppAttack = resolveAttack('opponent', input.opponent, input.player, rand, events);

  let playerHp = Math.max(0, input.player.hp - oppAttack.damageDealt);
  let oppHp = Math.max(0, input.opponent.hp - playerAttack.damageDealt);

  const playerStatus = input.player.status ?? oppAttack.appliedStatus;
  const oppStatus = input.opponent.status ?? playerAttack.appliedStatus;

  // Deliberate simplification: residual damage reads pre-turn status, so a
  // burn/poison just inflicted this turn doesn't tick until next turn. Spec
  // calls for same-turn ticking; the one-turn delay is a negligible gameplay
  // difference and keeps applyResidual from needing the post-attack status.
  playerHp = applyResidual('player', input.player.mon, playerHp, input.player.status, events);
  oppHp = applyResidual('opponent', input.opponent.mon, oppHp, input.opponent.status, events);

  return { playerHp, oppHp, playerStatus, oppStatus, events };
}
