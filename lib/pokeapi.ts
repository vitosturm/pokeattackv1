import { MoveSchema, PokemonSummarySchema, type Move, type PokemonSummary } from './types';

const BASE = 'https://pokeapi.co/api/v2';

export class PokeApiError extends Error {
  constructor(message: string, public status?: number) {
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

interface RawStat { base_stat: number; stat: { name: string } }
interface RawType { type: { name: string } }
interface RawPokemon {
  id: number;
  name: string;
  types: RawType[];
  stats: RawStat[];
}

const STAT_MAP: Record<string, keyof PokemonSummary['stats']> = {
  'hp': 'hp',
  'attack': 'attack',
  'defense': 'defense',
  'special-attack': 'specialAttack',
  'special-defense': 'specialDefense',
  'speed': 'speed',
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
  damage_class: { name: 'physical' | 'special' | 'status' };
}

export async function getMove(idOrName: number | string): Promise<Move> {
  const raw = await getJson<RawMove>(`${BASE}/move/${idOrName}`);
  return MoveSchema.parse({
    id: raw.id,
    name: raw.name,
    type: raw.type.name,
    power: raw.power,
    pp: raw.pp,
    damageClass: raw.damage_class.name,
  });
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
