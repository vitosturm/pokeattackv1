import {
  MoveSchema,
  PokemonSummarySchema,
  type Move,
  type PokemonSummary,
  type StatusCondition,
} from './types';

const BASE = 'https://pokeapi.co/api/v2';

export class PokeApiError extends Error {
  constructor(
    message: string,
    public status?: number,
  ) {
    super(message);
  }
}

async function getJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { next: { revalidate: 86400 } });
  if (!res.ok) throw new PokeApiError(`PokeAPI ${res.status} for ${url}`, res.status);
  return (await res.json()) as T;
}

export function spriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/other/official-artwork/${id}.png`;
}

export function animatedSpriteUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/versions/generation-v/black-white/animated/${id}.gif`;
}

export function cryUrl(id: number): string {
  return `https://raw.githubusercontent.com/PokeAPI/cries/main/cries/pokemon/latest/${id}.ogg`;
}

interface RawStat {
  base_stat: number;
  stat: { name: string };
}
interface RawType {
  type: { name: string };
}
interface RawPokemon {
  id: number;
  name: string;
  types: RawType[];
  stats: RawStat[];
}

const STAT_MAP: Record<string, keyof PokemonSummary['stats']> = {
  hp: 'hp',
  attack: 'attack',
  defense: 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  speed: 'speed',
};

export async function getPokemon(id: number): Promise<PokemonSummary> {
  const raw = await getJson<RawPokemon>(`${BASE}/pokemon/${id}`);
  const stats = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
  for (const s of raw.stats) {
    const k = STAT_MAP[s.stat.name];
    if (k) stats[k] = s.base_stat;
  }
  return PokemonSummarySchema.parse({
    id: raw.id,
    name: raw.name,
    types: raw.types.map((t) => t.type.name),
    stats,
    sprite: spriteUrl(raw.id),
  });
}

interface RawMove {
  id: number;
  name: string;
  type: { name: string };
  power: number | null;
  pp: number;
  accuracy: number | null;
  damage_class: { name: 'physical' | 'special' | 'status' };
  meta?: {
    ailment?: { name: string };
    ailment_chance?: number;
    crit_rate?: number;
  };
}

const AILMENT_NAME_MAP: Record<string, StatusCondition> = {
  paralysis: 'paralysis',
  burn: 'burn',
  poison: 'poison',
};

export async function getMove(idOrName: number | string): Promise<Move> {
  const raw = await getJson<RawMove>(`${BASE}/move/${idOrName}`);
  const rawAilment = raw.meta?.ailment?.name;
  return MoveSchema.parse({
    id: raw.id,
    name: raw.name,
    type: raw.type.name,
    power: raw.power,
    pp: raw.pp,
    damageClass: raw.damage_class.name,
    accuracy: raw.accuracy,
    ailment: rawAilment ? (AILMENT_NAME_MAP[rawAilment] ?? null) : null,
    ailmentChance: raw.meta?.ailment_chance ?? 0,
    highCrit: (raw.meta?.crit_rate ?? 0) > 0,
  });
}

interface RawPokemonMoveEntry {
  move: { name: string; url: string };
  version_group_details: Array<{
    level_learned_at: number;
    move_learn_method: { name: string };
    version_group: { name: string };
  }>;
}

interface RawPokemonWithMoves extends RawPokemon {
  moves: RawPokemonMoveEntry[];
}

export async function getPokemonWithMoves(
  id: number,
): Promise<{ pokemon: PokemonSummary; moves: Move[] }> {
  const raw = await getJson<RawPokemonWithMoves>(`${BASE}/pokemon/${id}`);

  const stats = { hp: 0, attack: 0, defense: 0, specialAttack: 0, specialDefense: 0, speed: 0 };
  for (const s of raw.stats) {
    const k = STAT_MAP[s.stat.name];
    if (k) stats[k] = s.base_stat;
  }
  const pokemon = PokemonSummarySchema.parse({
    id: raw.id,
    name: raw.name,
    types: raw.types.map((t) => t.type.name),
    stats,
    sprite: spriteUrl(raw.id),
  });

  const candidates = raw.moves
    .filter((m) =>
      m.version_group_details.some(
        (d) => d.move_learn_method.name === 'level-up' && d.version_group.name === 'red-blue',
      ),
    )
    .slice(0, 12)
    .map((m) => m.move.name);

  const moves: Move[] = [];
  for (const name of candidates) {
    if (moves.length >= 4) break;
    try {
      const move = await getMove(name);
      if (move.damageClass !== 'status' && move.power > 0) moves.push(move);
    } catch {
      // skip moves that fail to load
    }
  }

  if (moves.length < 4) {
    const fallbacks = ['tackle', 'scratch', 'bite', 'quick-attack'];
    for (const name of fallbacks) {
      if (moves.length >= 4) break;
      if (moves.some((m) => m.name === name)) continue;
      try {
        const move = await getMove(name);
        if (move.damageClass !== 'status' && move.power > 0) moves.push(move);
      } catch {
        // skip
      }
    }
  }

  return { pokemon, moves: moves.slice(0, 4) };
}

export const GEN1_IDS = Array.from({ length: 151 }, (_, i) => i + 1);

export function randomGen1Ids(count: number): number[] {
  const picks: number[] = [];
  const pool = [...GEN1_IDS];
  for (let i = 0; i < count && pool.length; i++) {
    const idx = Math.floor(Math.random() * pool.length);
    picks.push(pool.splice(idx, 1)[0]);
  }
  return picks;
}
