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

export async function getTopScores(limit = 50) {
  const take = Math.min(Math.max(1, Math.floor(Number(limit) || 50)), 100);
  return prisma.leaderboard.findMany({
    orderBy: [{ score: 'desc' }, { createdAt: 'asc' }],
    take,
  });
}
