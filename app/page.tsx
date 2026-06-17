import { HeroStage } from '@/components/HeroStage';
import { LenisProvider } from '@/components/LenisProvider';
import { SectionTransition } from '@/components/SectionTransition';
import { HomePokedexPreview } from '@/components/HomePokedexPreview';
import { HomeTypeDemo } from '@/components/HomeTypeDemo';
import { HomeLeaderboardPreview } from '@/components/HomeLeaderboardPreview';
import { getTopScores, getLeaderboardSummary } from '@/app/actions/leaderboard';

export const dynamic = 'force-dynamic'; // leaderboard preview reads from Neon

export default async function HomePage() {
  // Load hero leaderboard data once; fall back gracefully if the DB is unreachable.
  let topRows: Awaited<ReturnType<typeof getTopScores>> = [];
  let summary = { players: 0, battles: 0 };
  try {
    [topRows, summary] = await Promise.all([getTopScores(3), getLeaderboardSummary()]);
  } catch {
    // keep defaults — the hero panel renders its empty state
  }

  return (
    <LenisProvider>
      <HeroStage topRows={topRows} summary={summary} />
      <SectionTransition>
        <HomePokedexPreview />
      </SectionTransition>
      <SectionTransition>
        <HomeTypeDemo />
      </SectionTransition>
      <SectionTransition>
        <HomeLeaderboardPreview />
      </SectionTransition>
    </LenisProvider>
  );
}
