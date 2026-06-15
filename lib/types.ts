import { z } from 'zod';
import { TYPES } from './type-chart';

export const TypeSchema = z.enum(TYPES);

export const StatsSchema = z.object({
  hp: z.number().int().nonnegative(),
  attack: z.number().int().nonnegative(),
  defense: z.number().int().nonnegative(),
  specialAttack: z.number().int().nonnegative(),
  specialDefense: z.number().int().nonnegative(),
  speed: z.number().int().nonnegative(),
});

export const PokemonSummarySchema = z.object({
  id: z.number().int().min(1).max(151),
  name: z.string(),
  types: z.array(TypeSchema).min(1).max(2),
  stats: StatsSchema,
  sprite: z.string(),
});
export type PokemonSummary = z.infer<typeof PokemonSummarySchema>;

export const MoveSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  type: TypeSchema,
  power: z
    .number()
    .int()
    .nullable()
    .transform((v) => v ?? 0),
  pp: z.number().int().nonnegative(),
  damageClass: z.enum(['physical', 'special', 'status']),
});
export type Move = z.infer<typeof MoveSchema>;

export const LeaderboardEntrySchema = z.object({
  id: z.string(),
  playerName: z.string().min(1).max(24),
  score: z.number().int().nonnegative(),
  wins: z.number().int().nonnegative(),
  battles: z.number().int().nonnegative(),
  createdAt: z.date(),
});
export type LeaderboardEntry = z.infer<typeof LeaderboardEntrySchema>;

export const SubmitScoreInputSchema = z
  .object({
    playerName: z.string().min(1).max(24),
    score: z.number().int().nonnegative().max(1_000_000),
    wins: z.number().int().nonnegative().max(10_000),
    battles: z.number().int().positive().max(10_000),
  })
  .refine((v) => v.wins <= v.battles, { message: 'wins cannot exceed battles' });
export type SubmitScoreInput = z.infer<typeof SubmitScoreInputSchema>;
