'use server';

import { revalidatePath } from 'next/cache';
import { prisma } from '@/lib/prisma';
import { SubmitScoreInputSchema, type SubmitScoreInput } from '@/lib/types';

export type SubmitResult = { ok: true; id: string } | { ok: false; error: 'invalid' | 'db' };

export async function submitScore(input: SubmitScoreInput): Promise<SubmitResult> {
  const parsed = SubmitScoreInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: 'invalid' };

  try {
    const row = await prisma.leaderboard.create({ data: parsed.data });
    revalidatePath('/leaderboard');
    return { ok: true, id: row.id };
  } catch {
    return { ok: false, error: 'db' };
  }
}

export interface LeaderboardRow {
  id: string;
  playerName: string;
  score: number;
  wins: number;
  battles: number;
  createdAt: Date;
}

export async function getTopScores(limit = 50): Promise<LeaderboardRow[]> {
  const take = Math.min(Math.max(1, Math.floor(Number(limit) || 50)), 100);
  return prisma.leaderboard.findMany({
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    take,
  });
}

export interface LeaderboardSummary {
  players: number;
  battles: number;
}

/** Aggregate counters for the hero "Live Leaderboard" panel. */
export async function getLeaderboardSummary(): Promise<LeaderboardSummary> {
  const [players, agg] = await Promise.all([
    prisma.leaderboard.count(),
    prisma.leaderboard.aggregate({ _sum: { battles: true } }),
  ]);
  return { players, battles: agg._sum.battles ?? 0 };
}
